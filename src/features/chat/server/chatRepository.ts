import { createClient } from '@/shared/lib/supabase/server';
import type { Plan } from '@/entities/plan/types';
import {
  serializeCardPayload,
  tryParseCardPayload,
} from '@/features/chat/lib/chatCard';
import type { ChatCardPayload, ChatKeywords } from '@/features/chat/types';

import type { PlanJoinProgress } from '@/entities/planJoin/types';

export interface DbChatMessage {
  /** chat_messages.id(bigint)를 문자열로 - 클라이언트 ChatMessage.id와 모양을 맞춘다 */
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

interface ChatMessageRow {
  id: number;
  sender_type: 'USER' | 'AI';
  content: string;
  created_at: string;
}

function mapMessageRow(row: ChatMessageRow): DbChatMessage {
  return {
    id: String(row.id),
    role: row.sender_type === 'USER' ? 'user' : 'ai',
    content: row.content,
    createdAt: row.created_at,
  };
}

/**
 * 회원의 "현재" 대화 세션을 가져오거나, 없으면(첫 메시지) 새로 만든다.
 * 이 화면엔 대화 목록 UI가 없어서, 가장 최근 chats row 하나를 CHAT-014(초기화)
 * 전까지 계속 재사용한다 - 여러 세션을 오가는 건 지금 스코프 밖이다.
 */
export async function getOrCreateActiveChat(
  userId: string,
): Promise<{ id: string; keywords: ChatKeywords }> {
  const existing = await getActiveChat(userId);
  if (existing) return existing;

  return createNewChat(userId);
}

/** 조회만 한다(없어도 새로 안 만듦) - 히스토리 조회 시, 아직 대화를 시작 안 한
 * 회원한테 빈 세션을 만들어줄 필요는 없어서 생성용과 분리해뒀다. */
export async function getActiveChat(
  userId: string,
): Promise<{ id: string; keywords: ChatKeywords } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chats')
    .select('id, keywords')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; keywords: ChatKeywords }>();

  if (error) {
    throw new Error(`채팅 세션 조회 실패: ${error.message}`);
  }
  return data;
}

/** CHAT-014: 대화 초기화 시 새 세션을 강제로 만든다. 이전 세션을 지우는 건 이
 * 함수의 책임이 아니다 - 호출부(reset 라우트)가 deleteChat으로 먼저 지운다. */
export async function createNewChat(userId: string): Promise<{ id: string; keywords: ChatKeywords }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: userId })
    .select('id, keywords')
    .single<{ id: string; keywords: ChatKeywords }>();

  if (error || !data) {
    throw new Error(`채팅 세션 생성 실패: ${error?.message}`);
  }
  return data;
}

/**
 * CHAT-014: 대화 초기화 시 이전 세션을 완전히 지운다. chat_messages/chat_summary는
 * chats(id)를 on delete cascade로 참조하고 있어서(database-schema.sql), chats 행
 * 하나만 지우면 그 세션의 메시지·요약까지 한 번에 같이 지워진다 - 따로 지울 필요 없음.
 */
export async function deleteChat(chatId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('chats').delete().eq('id', chatId);

  if (error) {
    throw new Error(`이전 세션 삭제 실패: ${error.message}`);
  }
}

export async function insertMessage(
  chatId: string,
  role: 'user' | 'ai',
  content: string,
): Promise<DbChatMessage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      sender_type: role === 'user' ? 'USER' : 'AI',
      content,
    })
    .select('id, sender_type, content, created_at')
    .single<ChatMessageRow>();

  if (error || !data) {
    throw new Error(`메시지 저장 실패: ${error?.message}`);
  }
  return mapMessageRow(data);
}

/** 여러 메시지를 한 번에 저장한다(카드 마커처럼 여러 행이 한 세트로 붙는 경우, 또는
 * 비회원 대화 승계처럼 한 세션 전체를 한 번에 넣는 경우) - 배열 순서 그대로 저장돼서,
 * chat_messages의 id/created_at 순서도 그 순서를 따른다(한 INSERT 문이라 여러 요청을
 * 동시에 보낼 때처럼 순서가 뒤바뀔 위험이 없다). */
export async function insertMessages(
  chatId: string,
  rows: { role: 'user' | 'ai'; content: string }[],
): Promise<DbChatMessage[]> {
  if (rows.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(
      rows.map((row) => ({
        chat_id: chatId,
        sender_type: row.role === 'user' ? 'USER' : 'AI',
        content: row.content,
      })),
    )
    .select('id, sender_type, content, created_at')
    .returns<ChatMessageRow[]>();

  if (error) {
    throw new Error(`메시지 저장 실패: ${error.message}`);
  }
  return (data ?? []).map(mapMessageRow);
}

/**
 * CARD-029: 가입 폼을 끼워 넣은 자리를 저장한다. "가입할래" 사용자 발화 + JSON 마커
 * AI 메시지 순으로 그냥 새 메시지 두 개를 추가하면 끝이다 - chat_messages는 생성
 * 순서대로 정렬되니, 별도로 "몇 번째 메시지 뒤"를 저장하지 않아도 위치가 그대로
 * 보존된다(복구 시 이 마커 앞의 마지막 메시지를 기준으로 다시 만들면 된다).
 */
export async function insertJoinFlowMessages(
  chatId: string,
  plan: Pick<Plan, 'id' | 'name'>,
): Promise<void> {
  await insertMessages(chatId, [
    { role: 'user', content: `${plan.name} 요금제 가입할래` },
    { role: 'ai', content: serializeCardPayload({ type: 'join_flow', planId: plan.id }) },
  ]);
}

/**
 * CARD-043/046: 가입 카드의 진행 상태를 그 카드의 마커 행에 덮어쓴다.
 *
 * 새 행을 쌓지 않고 이미 있는 마커를 고치는 이유는, 마커 행 하나가 카드 한 장에
 * 대응하기 때문이다 - 진행할 때마다 행이 늘면 복구할 때 같은 카드가 여러 장 뜬다.
 * 같은 요금제로 여러 번 신청한 흔적이 있으면 가장 최근 것을 고친다.
 *
 * 넘어온 값만 덮어쓴다. 완료만 알리는 호출이 이미 저장된 진행 단계를 지우면
 * 안 되기 때문이다. 고칠 마커를 못 찾으면 false 를 돌려준다.
 */
export async function updateJoinFlowMarker(
  chatId: string,
  planId: number,
  patch: { progress?: PlanJoinProgress; isCompleted?: boolean },
): Promise<boolean> {
  const supabase = await createClient();

  // content 로 1차 추리고(마커는 JSON 이라 반드시 이 낱말을 품는다),
  // 실제 판별은 파싱해서 한다 - 우연히 같은 낱말을 쓴 대화 텍스트를 걸러내기 위함.
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, content')
    .eq('chat_id', chatId)
    .eq('sender_type', 'AI')
    .like('content', '%join_flow%')
    .order('id', { ascending: false })
    .returns<{ id: number; content: string }[]>();

  if (error) {
    throw new Error(`가입 카드 조회 실패: ${error.message}`);
  }

  const target = (data ?? [])
    .map((row) => ({ row, payload: tryParseCardPayload(row.content) }))
    .find(
      ({ payload }) =>
        payload?.type === 'join_flow' && payload.planId === planId,
    );

  if (!target || target.payload?.type !== 'join_flow') return false;

  const next: ChatCardPayload = {
    ...target.payload,
    ...(patch.progress !== undefined ? { progress: patch.progress } : {}),
    ...(patch.isCompleted !== undefined
      ? { isCompleted: patch.isCompleted }
      : {}),
  };

  const { error: updateError } = await supabase
    .from('chat_messages')
    .update({ content: serializeCardPayload(next) })
    .eq('id', target.row.id);

  if (updateError) {
    throw new Error(`가입 카드 저장 실패: ${updateError.message}`);
  }

  return true;
}

/**
 * CARD-043: 가입 결과 말풍선과 그 표시 마커를 한 세트로 남긴다.
 * 마커는 바로 앞 AI 메시지가 가입 결과라는 뜻이고, 복구할 때 축하 카드를 다시 붙인다.
 */
export async function insertJoinResultMessages(
  chatId: string,
  resultMessage: string,
): Promise<void> {
  await insertMessages(chatId, [
    { role: 'ai', content: resultMessage },
    { role: 'ai', content: serializeCardPayload({ type: 'join_result' }) },
  ]);
}

export async function updateChatKeywords(
  chatId: string,
  keywords: ChatKeywords,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('chats').update({ keywords }).eq('id', chatId);

  if (error) {
    throw new Error(`조건 저장 실패: ${error.message}`);
  }
}

export interface DbChatSummary {
  summary: string;
  lastMessageId: number | null;
}

export async function getChatSummary(chatId: string): Promise<DbChatSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_summary')
    .select('summary, last_message_id')
    .eq('chat_id', chatId)
    .maybeSingle<{ summary: string; last_message_id: number | null }>();

  if (error) {
    throw new Error(`요약 조회 실패: ${error.message}`);
  }
  if (!data) return null;

  return { summary: data.summary, lastMessageId: data.last_message_id };
}

/** chat_summary는 세션당 1건(chat_id unique) - 있으면 갱신, 없으면 생성 */
export async function upsertChatSummary(
  chatId: string,
  summary: string,
  lastMessageId: number,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('chat_summary')
    .upsert(
      { chat_id: chatId, summary, last_message_id: lastMessageId },
      { onConflict: 'chat_id' },
    );

  if (error) {
    throw new Error(`요약 저장 실패: ${error.message}`);
  }
}

/** 대화 전체 기록 - 복귀 시 화면에 그대로 복구하는 용도(CHAT-012의 회원 버전) */
export async function getChatMessages(chatId: string): Promise<DbChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, sender_type, content, created_at')
    .eq('chat_id', chatId)
    .order('id', { ascending: true })
    .returns<ChatMessageRow[]>();

  if (error) {
    throw new Error(`대화 기록 조회 실패: ${error.message}`);
  }
  return (data ?? []).map(mapMessageRow);
}
