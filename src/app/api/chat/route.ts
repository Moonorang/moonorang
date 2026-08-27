import { NextResponse } from 'next/server';

import { openai, OPENAI_MODEL } from '@/lib/openai';

// 연결 확인용 라우트
export async function POST(request: Request) {
  const { message } = await request.json();

  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json(
      { error: '메시지를 입력해주세요.' },
      { status: 400 },
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: message }],
    });

    const reply = completion.choices[0]?.message?.content ?? '';

    return NextResponse.json({ reply });
  } catch (error) {
    // 응답하지 못하는 사유 안내
    console.error('[api/chat] OpenAI 요청 실패:', error);
    return NextResponse.json(
      { error: 'LLM 응답 생성에 실패했습니다.' },
      { status: 500 },
    );
  }
}
