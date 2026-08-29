import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/core/streaming';

import { CHAT_TOOLS } from '@/features/chat/server/tools';
import type { SSESend } from '@/features/chat/lib/sse';
import { openai, OPENAI_MODEL } from '@/shared/lib/openai';

// NFR-002: 응답 대기는 최대 60초로 제한
const REQUEST_TIMEOUT_MS = 60_000;

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
}

/**
 * OpenAI 스트리밍 호출 한 번.
 * 텍스트 조각은 곧바로 token 이벤트로 흘려보내고(CHAT-006),
 * tool_calls 는 다 모아서 돌려준다.
 */
export async function streamCompletion({
  messages,
  useTools,
  send,
  onStreamCreated,
}: StreamCompletionParams): Promise<ToolCallBuilder[]> {
  const stream = await openai.chat.completions.create(
    {
      model: OPENAI_MODEL,
      messages,
      stream: true,
      ...(useTools ? { tools: CHAT_TOOLS } : {}),
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );
  onStreamCreated(stream);

  const toolCallBuilders = new Map<number, ToolCallBuilder>();

  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    if (!choice) continue;

    if (choice.delta.content) {
      send({ event: 'token', data: { delta: choice.delta.content } });
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

  return [...toolCallBuilders.values()];
}
