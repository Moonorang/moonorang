import { moExistsRequestSchema } from '@/features/join/lib/moSchema';
import { existsMoMessage } from '@/features/join/server/octomo';

/** CARD-037: 그 번호에서 인증 문자가 왔는지 조회 - 화면이 주기적으로 부른다 */
export async function POST(request: Request) {
  const parsed = moExistsRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const result = await existsMoMessage(parsed.data.mobileNum, parsed.data.code);

  if (!result.ok) {
    return Response.json(
      { message: result.failure.message },
      { status: result.failure.status },
    );
  }

  return Response.json({ exists: result.exists });
}
