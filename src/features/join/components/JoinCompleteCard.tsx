import Image from 'next/image';

interface JoinCompleteCardProps {
  /** 무엇을 가입했는지에 따라 달라지는 축하 문구 (data/complete.ts) */
  message: string;
}

/**
 * CARD-043: 가입을 마치면 결과 말풍선 아래에 함께 붙는 축하 카드.
 *
 * 말풍선 아래에 붙는 조각이라 스스로 말풍선을 만들지 않는다 - 사용량 분석 카드와
 * 같은 자리에 같은 방식으로 들어간다.
 * 폭은 대화에 나란히 서는 가입 카드와 같은 값으로 맞춘다.
 */
export default function JoinCompleteCard({ message }: JoinCompleteCardProps) {
  return (
    <div className="w-[min(80%,440px)] rounded-md bg-background-default p-4">
      {/* 캐릭터는 장식이라 대체 텍스트를 비워 읽지 않게 한다 */}
      <Image
        src="/images/join/complete-character.png"
        alt=""
        width={100}
        height={102}
        className="mx-auto"
      />

      <p className="mt-4 text-center text-12 leading-fixed font-medium text-text-primary">
        {message}
      </p>
    </div>
  );
}
