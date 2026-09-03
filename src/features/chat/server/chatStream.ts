import { APIConnectionTimeoutError, APIError } from 'openai';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/core/streaming';

import { getAddOnAdoptionRates, getAllAddOns } from '@/entities/addOn/server';
import { getAllMembershipBrands } from '@/entities/membershipBrand/server';
import { getAllPlans } from '@/entities/plan/server/planRepository';
import {
  getAllSubscriptions,
  getSubscriptionAdoptionRates,
} from '@/entities/subscription/server';
import { runFindNearbyMemberships } from '@/features/chat/server/findNearbyMemberships';
import { mergeKeywords } from '@/features/chat/lib/mergeKeywords';
import { createSSESender, type SSESend } from '@/features/chat/lib/sse';
import { runSavingsAnalysis } from '@/features/chat/server/analyzeSavings';
import {
  loadMemberChatContext,
  persistMemberAiTurn,
  persistMemberUserMessage,
} from '@/features/chat/server/memberChat';
import { streamCompletion, type ToolCallBuilder } from '@/features/chat/server/openaiStream';
import { runAddOnRecommendation } from '@/features/chat/server/recommendAddOns';
import { runPlanRecommendation } from '@/features/chat/server/recommendPlans';
import { runSubscriptionRecommendation } from '@/features/chat/server/recommendSubscriptions';
import { buildSystemPrompt } from '@/features/chat/server/systemPrompt';
import { ACTION_TOOLS, parseExtractConditionsArguments } from '@/features/chat/server/tools';
import type { ChatCardPayload, ChatKeywords, SummarizeTurnMessage } from '@/features/chat/types';

import type { AddOn } from '@/entities/addOn/types';
import type { MembershipBrand } from '@/entities/membershipBrand/types';
import type { Plan } from '@/entities/plan/types';
import type { Subscription } from '@/entities/subscription/types';

interface ToolResultContext {
  plans: Plan[];
  addOns: AddOn[];
  addOnAdoptionRates: Map<number, number>;
  subscriptions: Subscription[];
  subscriptionAdoptionRates: Map<number, number>;
  membershipBrands: MembershipBrand[];
  location: { lat: number; lng: number } | undefined;
  mergedKeywords: ChatKeywords;
  userId: string | null;
  send: SSESend;
}

// 호출된 tool 이름별로 실제 계산/조회를 수행하고, 다음 턴의 tool 결과 메시지 content로
// 쓸 값을 돌려준다. recommend_plans/show_current_plan/analyze_savings/show_usage_trend/
// recommend_addons/recommend_subscriptions/find_nearby_memberships는 여기서 SSE
// 이벤트도 같이 내보낸다(카드 데이터를 텍스트보다 먼저 화면에 꽂아 넣기 위함).
async function getToolResultContent(
  call: ToolCallBuilder,
  {
    plans,
    addOns,
    addOnAdoptionRates,
    subscriptions,
    subscriptionAdoptionRates,
    membershipBrands,
    location,
    mergedKeywords,
    userId,
    send,
  }: ToolResultContext,
): Promise<unknown> {
  switch (call.name) {
    case 'recommend_plans':
      return runPlanRecommendation(plans, mergedKeywords, send);
    case 'show_current_plan':
      return runSavingsAnalysis({ userId, allPlans: plans, send, mode: 'plan_info' });
    case 'analyze_savings':
      return runSavingsAnalysis({ userId, allPlans: plans, send, mode: 'savings' });
    case 'show_usage_trend':
      return runSavingsAnalysis({ userId, allPlans: plans, send, mode: 'trend' });
    case 'recommend_addons':
      return runAddOnRecommendation(addOns, addOnAdoptionRates, mergedKeywords, send);
    case 'recommend_subscriptions':
      return runSubscriptionRecommendation(
        subscriptions,
        subscriptionAdoptionRates,
        mergedKeywords,
        send,
      );
    case 'find_nearby_memberships':
      return runFindNearbyMemberships(location, send, membershipBrands);
    default:
      return { ok: true, keywords: mergedKeywords };
  }
}

/**
 * 호출된 tool들 각각의 실행 결과로 (assistant tool_calls 메시지 + tool 결과 메시지들)을
 * 만들어 messages 뒤에 이어붙인다. calls가 비어있으면 원본을 그대로 돌려준다.
 */
async function appendToolRound(
  messages: ChatCompletionMessageParam[],
  calls: ToolCallBuilder[],
  context: ToolResultContext,
): Promise<ChatCompletionMessageParam[]> {
  if (calls.length === 0) return messages;

  const assistantToolCalls: ChatCompletionMessageToolCall[] = calls.map(
    (call) => ({
      id: call.id,
      type: 'function',
      function: { name: call.name, arguments: call.argsBuffer },
    }),
  );

  // 모델이 같은 tool을 같은 인자로 한 턴에 두 번 부르는 경우가 실측으로 관측됐다
  // (예: recommend_plans 중복 호출). 실행 도구(recommend_plans 등)는 전부 인자가
  // 없어서 두 번째 호출도 항상 첫 번째와 완전히 같은 결과가 나오는데, 그대로 두면
  // recommendation 같은 SSE 카드 이벤트가 중복으로 나가고 계산도 두 번 한다.
  // name+argsBuffer가 같은 호출은 결과(Promise)를 재사용한다 - 다만 OpenAI에 보낼
  // tool 메시지는 호출된 tool_call_id 개수만큼 여전히 다 채워야 한다(요청 계약상
  // 모든 tool_call에 대응하는 tool 메시지가 있어야 함).
  const resultCache = new Map<string, Promise<unknown>>();
  const getCachedResult = (call: ToolCallBuilder) => {
    const key = `${call.name}:${call.argsBuffer}`;
    const cached = resultCache.get(key);
    if (cached) return cached;

    const result = getToolResultContent(call, context);
    resultCache.set(key, result);
    return result;
  };

  const toolResultMessages: ChatCompletionMessageParam[] = await Promise.all(
    calls.map(async (call) => ({
      role: 'tool' as const,
      tool_call_id: call.id,
      content: JSON.stringify(await getCachedResult(call)),
    })),
  );

  return [
    ...messages,
    { role: 'assistant', content: null, tool_calls: assistantToolCalls },
    ...toolResultMessages,
  ];
}

// 카탈로그에 있는 실제 요금제명·부가서비스명이 텍스트에 하나라도 등장하는지 -
// 그걸 만든 tool(recommend_plans/recommend_addons)이 안 불렸는데 이게 참이면,
// 그 텍스트는 모델이 지어낸 것이다(CARD-002/NFR-003~004 위반).
function containsCatalogName(
  text: string,
  plans: Plan[],
  addOns: AddOn[],
  subscriptions: Subscription[],
  membershipBrands: MembershipBrand[],
): boolean {
  return (
    plans.some((plan) => text.includes(plan.name)) ||
    addOns.some((addOn) => text.includes(addOn.title)) ||
    subscriptions.some((subscription) => text.includes(subscription.name)) ||
    membershipBrands.some((brand) => text.includes(brand.name))
  );
}

/**
 * 한 번의 상담 요청을 SSE 스트림으로 만든다.
 *
 * 1턴: 시스템 프롬프트(+ 지금까지 파악된 조건) + 사용자 메시지로 호출. 아직 도구 호출
 *      여부가 안 정해진 구간이라 텍스트를 곧바로 화면에 보내지 않고 서버가 들고
 *      있는다(emitTokens: false) - 검증 전에 잘못된 내용이 화면에 노출되는 걸 막기
 *      위함이다. 이번 턴에 언급된 조건은 extract_conditions로, 추천 의도는
 *      recommend_plans(트리거)로 모아둔다.
 * 1.5턴(보정): extract_conditions는 불렀는데 실행 도구(recommend_plans/
 *      analyze_savings/show_usage_trend)를 하나도 안 부른 경우 - 모델이 두 도구를
 *      한 번에 병렬 호출하는 걸 가끔 놓치는 걸 실측으로 확인했다. 텍스트 생성 없이
 *      (emitTokens: false) 실행 도구 중 필요한 게 있으면 지금 호출하라고 한 번 더
 *      묻는다 - 추천 여부 자체의 판단은 여전히 모델이 하고(강제 호출 아님, tools
 *      'auto'), 다만 "narration과 tool call을 동시에 못 하는" 실패 유형만 보정한다.
 * 가드레일: 위 보정까지 거치고도 실행 도구가 끝내 하나도 안 불렸는데, 1턴 텍스트에
 *      실제 요금제명이 등장하면 - 서버 계산을 거치지 않은 값이 확실하므로(모델이
 *      직접 지어낸 것) 그 텍스트를 화면에 내보내지 않고 invalid_format 에러로
 *      처리한다. 이 시점까지는 아직 아무것도 화면에 안 나간 상태라 안전하게 버릴 수
 *      있다.
 * 2턴: 실행 도구가 하나라도 확정됐으면 - 실제 결과는 서버가 계산해서 카드 이벤트로
 *      먼저 내보내고, 그 결과를 tool 메시지로 넣어 다시 호출해 자연어 마무리
 *      응답을 스트리밍한다(이 구간은 이미 검증된 사실을 근거로 하므로 정상적으로
 *      실시간 스트리밍). 확정된 게 없어도, tool만 부르고 텍스트를 하나도 안
 *      보냈으면(조건만 언급한 메시지 등) 빈 말풍선을 막기 위해 같은 방식으로 돈다.
 *      가드레일을 통과한 1턴 텍스트는 여기서 한 번에 흘려보낸 뒤 이어붙인다.
 */
export function createChatStream(
  message: string,
  incomingKeywords: ChatKeywords,
  summary?: string,
  /** CARD-023: 절약 상담은 로그인 사용자 전용 - route.ts가 미리 확인해서 넘겨준다 */
  userId: string | null = null,
  /** §2.4: summary에 아직 반영 안 된 구간의 원문 - 직전 대화를 기억하게 하는 용도 */
  recentMessages: SummarizeTurnMessage[] = [],
  /** CARD-028: 브라우저 Geolocation. 없으면(권한 거부 등) find_nearby_memberships가
   * ok: false로 응답한다 - DB에 저장하지 않고 매 요청 왕복만 한다(keywords와 같은 방식). */
  location?: { lat: number; lng: number },
): ReadableStream {
  // 클라이언트가 연결을 끊었을 때(페이지 이동 등) cancel() 에서 진행 중인 스트림을 정리
  let activeStream: Stream<ChatCompletionChunk> | null = null;

  const rememberStream = (stream: Stream<ChatCompletionChunk>) => {
    activeStream = stream;
  };

  return new ReadableStream({
    async start(controller) {
      const send = createSSESender(controller);

      try {
        const [
          plans,
          addOns,
          addOnAdoptionRates,
          subscriptions,
          subscriptionAdoptionRates,
          membershipBrands,
        ] = await Promise.all([
          getAllPlans(),
          getAllAddOns(),
          getAddOnAdoptionRates(),
          getAllSubscriptions(),
          getSubscriptionAdoptionRates(),
          getAllMembershipBrands(),
        ]);

        // 회원이면 DB(chats/chat_messages/chat_summary)가 유일한 진짜 기록이라,
        // 클라이언트가 보낸 keywords/summary/recentMessages는 무시하고 여기서
        // 다시 읽어온다 - 비회원은 그대로 클라이언트 왕복 값을 쓴다(CHAT-011).
        const memberChat = userId ? await loadMemberChatContext(userId) : null;
        if (memberChat) {
          incomingKeywords = memberChat.keywords;
          summary = memberChat.summary;
          recentMessages = memberChat.recentMessages;
          // 응답이 실패해도 사용자가 실제로 보낸 말은 남아있어야 하므로 곧바로 저장한다.
          await persistMemberUserMessage(memberChat.chatId, message);
        }

        const messages: ChatCompletionMessageParam[] = [
          {
            role: 'system',
            content: buildSystemPrompt(
              plans,
              addOns,
              subscriptions,
              membershipBrands,
              incomingKeywords,
              summary,
            ),
          },
          // §2.4 "최근 채팅 메시지 N개" - summary가 아직 못 따라잡은 구간의 원문.
          // ChatMessage/SummarizeTurnMessage의 'ai' role을 OpenAI의 'assistant'로 바꿔준다.
          ...recentMessages.map(
            (turn): ChatCompletionMessageParam => ({
              role: turn.role === 'ai' ? 'assistant' : 'user',
              content: turn.content,
            }),
          ),
          { role: 'user', content: message },
        ];

        // 1턴은 아직 검증 전이라 텍스트를 화면에 안 보내고 서버가 들고 있는다
        // (emitTokens: false) - 가드레일을 통과해야 비로소 흘려보낸다.
        const { toolCalls: turn1Calls, text: turn1Text } =
          await streamCompletion({
            messages,
            useTools: true,
            send,
            emitTokens: false,
            onStreamCreated: rememberStream,
          });

        const extractCall = turn1Calls.find(
          (call) => call.name === 'extract_conditions',
        );
        let recommendCall = turn1Calls.find(
          (call) => call.name === 'recommend_plans',
        );
        let showCurrentPlanCall = turn1Calls.find(
          (call) => call.name === 'show_current_plan',
        );
        let analyzeSavingsCall = turn1Calls.find(
          (call) => call.name === 'analyze_savings',
        );
        let showUsageTrendCall = turn1Calls.find(
          (call) => call.name === 'show_usage_trend',
        );
        let recommendAddOnsCall = turn1Calls.find(
          (call) => call.name === 'recommend_addons',
        );
        let recommendSubscriptionsCall = turn1Calls.find(
          (call) => call.name === 'recommend_subscriptions',
        );
        let findNearbyMembershipsCall = turn1Calls.find(
          (call) => call.name === 'find_nearby_memberships',
        );

        const mergedKeywords = extractCall
          ? mergeKeywords(
              incomingKeywords,
              parseExtractConditionsArguments(extractCall.argsBuffer),
            )
          : incomingKeywords;

        // 회원이면 이번 턴에 실제로 화면에 보낸 카드(recommendation/addOnRecommendation/
        // subscriptionRecommendation/nearbyMembership/usage_analysis)를 그대로
        // 캡처해뒀다가, 나중에 DB에도 같은 스냅샷을 저장한다(CHAT-012 회원판).
        const capturedCards: ChatCardPayload[] = [];
        const trackingSend: SSESend = (event) => {
          if (event.event === 'recommendation') {
            capturedCards.push({ type: 'recommendation', plans: event.data.plans });
          } else if (event.event === 'addOnRecommendation') {
            capturedCards.push({
              type: 'add_on_recommendation',
              addOns: event.data.addOns,
            });
          } else if (event.event === 'subscriptionRecommendation') {
            capturedCards.push({
              type: 'subscription_recommendation',
              subscriptions: event.data.subscriptions,
            });
          } else if (event.event === 'nearbyMembership') {
            capturedCards.push({
              type: 'nearby_membership',
              memberships: event.data.memberships,
            });
          } else if (event.event === 'usageAnalysis') {
            capturedCards.push({ type: 'usage_analysis', data: event.data });
          }
          send(event);
        };

        const toolContext: ToolResultContext = {
          plans,
          addOns,
          addOnAdoptionRates,
          subscriptions,
          subscriptionAdoptionRates,
          membershipBrands,
          location,
          mergedKeywords,
          userId,
          send: trackingSend,
        };

        // 1턴 이후로는 시스템 프롬프트의 "지금까지 파악된 조건"도 mergedKeywords로
        // 최신화해서 넘긴다 - 안 그러면 보정 턴/마무리 턴이 "조건 없음"이라고 적힌
        // 시스템 프롬프트와 방금 추출된 tool 결과가 서로 모순돼, 모델이 recommend_plans
        // 호출을 주저하는 걸 실측으로 확인했다.
        const messagesWithMergedKeywords: ChatCompletionMessageParam[] =
          extractCall
            ? [
                {
                  role: 'system',
                  content: buildSystemPrompt(
                    plans,
                    addOns,
                    subscriptions,
                    membershipBrands,
                    mergedKeywords,
                    summary,
                  ),
                },
                ...messages.slice(1),
              ]
            : messages;

        // 1턴에서 실제로 호출된 tool들(추후 wrap-up 호출의 메시지 히스토리에 쌓아감)
        let messagesWithTools = await appendToolRound(
          messagesWithMergedKeywords,
          turn1Calls,
          toolContext,
        );

        // 1.5턴(보정): extract_conditions는 불렀는데 실행 도구는 하나도 안 부르고
        // 텍스트까지 낸 경우 - 병렬 호출을 놓친 걸로 보고, 텍스트 없이 실행 도구
        // 후보만 다시 판단하게 한다(강제 호출 아님 - 필요 없으면 여전히 안 부를 수 있음).
        const calledActionInTurn1 =
          Boolean(recommendCall) ||
          Boolean(showCurrentPlanCall) ||
          Boolean(analyzeSavingsCall) ||
          Boolean(showUsageTrendCall) ||
          Boolean(recommendAddOnsCall) ||
          Boolean(recommendSubscriptionsCall) ||
          Boolean(findNearbyMembershipsCall);

        if (extractCall && !calledActionInTurn1) {
          const decision = await streamCompletion({
            messages: messagesWithTools,
            useTools: true,
            tools: ACTION_TOOLS,
            send,
            emitTokens: false,
            onStreamCreated: rememberStream,
          });

          recommendCall = decision.toolCalls.find(
            (call) => call.name === 'recommend_plans',
          );
          showCurrentPlanCall = decision.toolCalls.find(
            (call) => call.name === 'show_current_plan',
          );
          analyzeSavingsCall = decision.toolCalls.find(
            (call) => call.name === 'analyze_savings',
          );
          showUsageTrendCall = decision.toolCalls.find(
            (call) => call.name === 'show_usage_trend',
          );
          recommendAddOnsCall = decision.toolCalls.find(
            (call) => call.name === 'recommend_addons',
          );
          recommendSubscriptionsCall = decision.toolCalls.find(
            (call) => call.name === 'recommend_subscriptions',
          );
          findNearbyMembershipsCall = decision.toolCalls.find(
            (call) => call.name === 'find_nearby_memberships',
          );

          messagesWithTools = await appendToolRound(
            messagesWithTools,
            decision.toolCalls,
            toolContext,
          );
        }

        const actionConfirmed =
          Boolean(recommendCall) ||
          Boolean(showCurrentPlanCall) ||
          Boolean(analyzeSavingsCall) ||
          Boolean(showUsageTrendCall) ||
          Boolean(recommendAddOnsCall) ||
          Boolean(recommendSubscriptionsCall) ||
          Boolean(findNearbyMembershipsCall);

        // 가드레일: 실행 도구가 끝내 하나도 안 불렸는데 1턴 텍스트에 실제 요금제명·
        // 부가서비스명·구독 상품명이 있으면 - 서버 계산을 거치지 않은 값이 확실하다
        // (CARD-001/002, NFR-003~004). extractCall 여부와 무관하게 항상 검사한다 -
        // extract_conditions조차 안 부르고 곧바로 카탈로그를 옮겨 적는 경우(예: 조건
        // 없이 "넷플릭스 관련 상품 있나요?")도 실제로 관측됐다. 아직 아무것도 화면에
        // 안 나간 상태이므로 그대로 버리고 에러로 전환한다(CARD-006: 재시도 가능).
        if (
          !actionConfirmed &&
          containsCatalogName(turn1Text, plans, addOns, subscriptions, membershipBrands)
        ) {
          console.error(
            '[api/chat] 가드레일: 추천 도구 없이 요금제·부가서비스·구독명 언급 감지 -',
            turn1Text,
          );
          send({
            event: 'error',
            data: {
              reason: 'invalid_format',
              message: '추천 결과를 확인하지 못했습니다. 다시 시도해주세요.',
            },
          });
          return;
        }

        // 가드레일을 통과한 1턴 텍스트를 이제 화면에 흘려보낸다.
        if (turn1Text) {
          send({ event: 'token', data: { delta: turn1Text } });
        }

        // 실행 도구가 하나라도 확정됐으면 결과를 설명할 마무리 턴이 필요하고,
        // 그게 아니어도 1턴이 텍스트 없이 tool만 부르고 끝났으면(조건만 언급한
        // 메시지 등) 빈 말풍선을 막기 위해 같은 방식으로 마무리 턴을 돌린다.
        const needsFollowUpTurn =
          actionConfirmed || (Boolean(extractCall) && !turn1Text);

        let turn2Text = '';
        if (needsFollowUpTurn) {
          ({ text: turn2Text } = await streamCompletion({
            messages: messagesWithTools,
            useTools: false,
            send,
            onStreamCreated: rememberStream,
          }));
        }

        // 회원이면 이번 턴의 AI 최종 응답(1턴+마무리 턴 합친 것)을 저장하고,
        // keywords도 DB에 반영한다 - 비회원은 client 왕복으로만 들고 있는다(CHAT-011).
        if (memberChat) {
          await persistMemberAiTurn(
            memberChat.chatId,
            turn1Text + turn2Text,
            mergedKeywords,
            capturedCards,
          );
        }

        // 클라이언트가 다음 요청에 그대로 실어 보낼 수 있게 최신 조건을 알려준다
        // (CHAT-011: 서버는 DB에 저장하지 않고 요청/응답 왕복으로만 들고 있는다).
        send({ event: 'keywords', data: { keywords: mergedKeywords } });
        send({ event: 'done', data: {} });
      } catch (error) {
        // CARD-005: 실패 사유를 구분해서 안내
        console.error('[api/chat] 스트리밍 실패:', error);

        send({
          event: 'error',
          data: {
            // APIConnectionTimeoutError는 APIError의 하위 타입이라 반드시 먼저 걸러야
            // 한다. 그 외 APIError(OpenAI가 5xx/4xx로 명시적으로 응답한 경우, 또는
            // 우리 서버가 OpenAI에 아예 연결하지 못한 경우)는 우리 서버와 사용자
            // 사이는 멀쩡하고 OpenAI 쪽 문제라 ai_server_error로 구분한다 - 사용자
            // 네트워크를 의심하게 만드는 안내를 보여주지 않기 위함이다.
            // APIError가 아닌 예외(우리 코드/DB 쪽 버그 등)만 runtime_unavailable로 남는다.
            reason:
              error instanceof APIConnectionTimeoutError
                ? 'timeout'
                : error instanceof APIError
                  ? 'ai_server_error'
                  : 'runtime_unavailable',
            message:
              error instanceof APIError
                ? error.message
                : 'LLM 응답 생성에 실패했습니다.',
          },
        });
      } finally {
        controller.close();
      }
    },

    cancel() {
      activeStream?.controller.abort();
    },
  });
}
