import Image from 'next/image';

/** 첫 단계 - 인사와 함께 마스코트(무너)를 크게 보여준다 */
export default function WelcomeVisual() {
  return (
    <div className="relative flex h-56 items-center justify-center">
      {/* 은은하게 뒤에서 떠 있는 원 - 스플래시와 같은 계열의 따뜻한 그러데이션 */}
      <div className="absolute h-44 w-44 rounded-full bg-linear-to-br from-gradient-from to-gradient-to opacity-60 blur-xl" />

      <span className="absolute top-4 right-[calc(50%-90px)] text-20 motion-safe:animate-bounce">
        ✨
      </span>
      <span className="absolute bottom-6 left-[calc(50%-96px)] text-16 motion-safe:animate-pulse">
        ⭐
      </span>

      <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-background-default shadow-default">
        <Image
          src="/images/chat/ai-avatar.png"
          alt="무너"
          width={112}
          height={112}
          priority
          className="h-28 w-28 object-contain"
        />
      </div>
    </div>
  );
}
