import { moQrRequestSchema } from '@/features/join/lib/moSchema';
import { issueMoQrCode } from '@/features/join/server/octomo';

/** CARD-037: 인증 코드를 담은 QR 발급 - API 키를 감추려고 서버를 거친다 */
export async function POST(request: Request) {
  const parsed = moQrRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const result = await issueMoQrCode(parsed.data.code);

  if (!result.ok) {
    return Response.json(
      { message: result.failure.message },
      { status: result.failure.status },
    );
  }

  return Response.json({ qrCode: result.qrCode });
}
