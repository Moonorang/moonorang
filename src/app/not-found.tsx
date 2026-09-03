import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/shared/utils/cn';

/** 존재하지 않는 경로로 들어왔을 때 - 홈(채팅)으로 돌아갈 수 있게 안내한다 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-(--width-container) min-w-(--width-container-min) flex-col items-center bg-background-subtle px-4 pt-(--height-header)">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <div className="absolute h-32 w-32 rounded-full bg-linear-to-br from-gradient-from to-gradient-to opacity-60 blur-xl" />
          <Image
            src="/images/test/loading-character.png"
            alt=""
            width={112}
            height={130}
            priority
            className="relative h-auto w-28"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-display text-32 text-action-secondary">404</p>
          <h1 className="text-18 font-bold text-text-primary">
            이 페이지는 무너도 못 찾았어요
          </h1>
          <p className="text-14 leading-fixed text-text-secondary">
            주소가 바뀌었거나 존재하지 않는 페이지예요.
            <br />
            아래 버튼으로 다시 돌아가 주세요!
          </p>
        </div>

        <Link
          href="/"
          className={cn(
            'relative mt-2 inline-flex cursor-pointer items-center justify-center overflow-hidden px-4 py-3 text-14 font-bold transition-colors',
            "after:pointer-events-none after:absolute after:inset-0 after:bg-black/20 after:opacity-0 after:transition-opacity after:content-['']",
            'hover:after:opacity-100',
            'rounded-sm bg-action-primary text-background-default',
          )}
        >
          채팅으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
