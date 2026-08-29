import Image from 'next/image';

type SectionTone = 'yellow' | 'red';

const TONE_STYLES: Record<SectionTone, string> = {
  yellow: 'bg-secondary-light-yellow',
  red: 'bg-secondary-light-red',
};

interface SectionTitleProps {
  title: string;
  iconSrc: string;
  iconWidth: number;
  iconHeight: number;
  iconTone: SectionTone;
}

/** 결과 화면의 섹션 머리말. 아이콘 배경색은 tone 으로만 고른다 */
export default function SectionTitle({
  title,
  iconSrc,
  iconWidth,
  iconHeight,
  iconTone,
}: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-md ${TONE_STYLES[iconTone]}`}
      >
        <Image src={iconSrc} alt="" width={iconWidth} height={iconHeight} />
      </div>
      <h2 className="text-12 font-medium text-text-main">{title}</h2>
    </div>
  );
}
