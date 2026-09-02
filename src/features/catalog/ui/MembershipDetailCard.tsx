import Image from 'next/image';

import Button from '@/shared/ui/Button';

import { CATALOG_IMAGE_BASE_PATH } from '@/features/catalog/constants';
import type { MembershipBrand } from '@/entities/membershipBrand/types';

interface MembershipDetailCardProps {
  brand: MembershipBrand;
  /**
   * 하단 버튼의 동작. 넘기지 않으면 버튼 자체를 그리지 않는다.
   * 다른 상세 카드의 onJoin 자리인데, 멤버십은 제휴 할인처 정보라
   * 가입이라는 동작이 없어서 확인하고 닫는 것으로 끝난다.
   */
  onConfirm?: () => void;
}

/**
 * 멤버십 제휴처 하나를 펼쳐 보여주는 상세 내용.
 * 폭·배경·바깥 여백은 감싸는 쪽이 정하고 여기서는 안쪽 간격만 갖는다.
 */
export default function MembershipDetailCard({
  brand,
  onConfirm,
}: MembershipDetailCardProps) {
  const { name, category, icon, discountRules } = brand;
  // membership_brands.icon 에는 파일명만 들어 있다.
  const imageSrc = `${CATALOG_IMAGE_BASE_PATH}/${icon}`;
  const summary = discountRules?.summary;
  const providedCount = discountRules?.detail?.provided_count;
  const instructions = discountRules?.detail?.instructions ?? [];

  return (
    <div className="flex flex-col">
      <h3 className="text-12 font-medium text-text-primary">제휴사 상세정보</h3>

      {/* 로고는 목록 카드와 같은 크기·모양으로 둔다 - 목록에서 상세로 들어와도 같은 것으로 읽힌다 */}
      <div className="mt-5 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-12 text-text-secondary">{category}</p>
          <p className="truncate text-16 font-medium text-text-primary">
            {name}
          </p>
        </div>

        <Image
          src={imageSrc}
          alt=""
          width={60}
          height={60}
          className="h-[60px] w-[60px] shrink-0 rounded-full border border-border-default object-cover"
        />
      </div>

      {summary && (
        <>
          <h4 className="mt-6 text-12 font-medium text-text-primary">혜택</h4>
          <p className="mt-2.5 text-12 leading-fixed whitespace-pre-line text-text-primary">
            {summary}
          </p>
          {providedCount && (
            <p className="mt-1 text-10 leading-fixed text-text-secondary">
              {providedCount}
            </p>
          )}
        </>
      )}

      {instructions.length > 0 && (
        <>
          <h4 className="mt-6 text-12 font-medium text-text-primary">
            이용 방법
          </h4>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4">
            {instructions.map((instruction) => (
              <li
                key={instruction}
                className="text-10 leading-fixed text-text-secondary"
              >
                {instruction}
              </li>
            ))}
          </ul>
        </>
      )}

      {onConfirm && (
        <Button
          variant="main"
          radius="sm"
          size="lg"
          isFullWidth
          onClick={onConfirm}
          appendClassName="mt-6"
        >
          확인
        </Button>
      )}
    </div>
  );
}
