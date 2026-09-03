import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/core/streaming';

import type { ChatCompletionTool } from 'openai/resources/chat/completions';

import { CHAT_TOOLS } from '@/features/chat/server/tools';
import type { SSESend } from '@/features/chat/lib/sse';
import {
  getOpenAIClient,
  OPENAI_MODEL,
  OPENAI_TEMPERATURE,
  OPENAI_SEED,
} from '@/shared/lib/openai';

// NFR-002: 응답 대기는 최대 30초로 제한
const REQUEST_TIMEOUT_MS = 30_000;

/** 스트리밍 중 조각으로 오는 tool_calls 델타를 index 기준으로 누적한 것 */
export interface ToolCallBuilder {
  id: string;
  name: string;
  argsBuffer: string;
}

interface StreamCompletionParams {
  messages: ChatCompletionMessageParam[];
  useTools: boolean;
  send: SSESend;
  /** 클라이언트가 연결을 끊었을 때 중단할 수 있도록 스트림을 바깥에 알린다 */
  onStreamCreated: (stream: Stream<ChatCompletionChunk>) => void;
  /** useTools일 때 기본은 CHAT_TOOLS 전체 - 도구 후보를 줄이고 싶을 때만 넘긴다 */
  tools?: ChatCompletionTool[];
  /**
   * false면 텍스트 조각을 token 이벤트로 안 보낸다(tool_calls만 수집). 병렬 tool 호출을
   * 놓치고 텍스트만 내는 걸 보정하는 내부 판단 전용 호출에 쓴다 - 사용자에게는 이미
   * 1턴의 텍스트가 나갔으므로, 이 호출이 또 텍스트를 내면 중복/모순된 문장이 겹친다.
   * 기본값 true(기존 동작 유지).
   */
  emitTokens?: boolean;
}

export interface StreamCompletionResult {
  toolCalls: ToolCallBuilder[];
  /**
   * 이번 호출에서 생성된 텍스트 전체(누적). emitTokens: false여도 항상 채워진다 -
   * 화면에는 안 보냈지만, 호출부가 사후에 검증(요금제명 등장 여부 등)하거나
   * 나중에 한 번에 흘려보낼 수 있게 하기 위함이다.
   */
  text: string;
}

/**
 * OpenAI 스트리밍 호출 한 번.
 * emitTokens(기본 true)면 텍스트 조각을 곧바로 token 이벤트로 흘려보내고(CHAT-006),
 * tool_calls와 누적 텍스트는 항상 모아서 돌려준다.
 */
export async function streamCompletion({
  messages,
  useTools,
  send,
  onStreamCreated,
  tools = CHAT_TOOLS,
  emitTokens = true,
}: StreamCompletionParams): Promise<StreamCompletionResult> {
  const stream = await getOpenAIClient().chat.completions.create(
    {
      model: OPENAI_MODEL,
      messages,
      stream: true,
      temperature: OPENAI_TEMPERATURE,
      seed: OPENAI_SEED,
      ...(useTools ? { tools } : {}),
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );
  onStreamCreated(stream);

  const toolCallBuilders = new Map<number, ToolCallBuilder>();
  let text = '';

  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    if (!choice) continue;

    if (choice.delta.content) {
      text += choice.delta.content;
      if (emitTokens) {
        send({ event: 'token', data: { delta: choice.delta.content } });
      }
    }

    for (const toolCallDelta of choice.delta.tool_calls ?? []) {
      const existing = toolCallBuilders.get(toolCallDelta.index);

      if (existing) {
        existing.argsBuffer += toolCallDelta.function?.arguments ?? '';
        continue;
      }

      toolCallBuilders.set(toolCallDelta.index, {
        id: toolCallDelta.id ?? '',
        name: toolCallDelta.function?.name ?? '',
        argsBuffer: toolCallDelta.function?.arguments ?? '',
      });
    }
  }

  return { toolCalls: [...toolCallBuilders.values()], text };
}
