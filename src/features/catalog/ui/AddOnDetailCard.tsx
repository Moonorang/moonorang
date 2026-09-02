import Button from '@/shared/ui/Button';

import {
  ADD_ON_ICON_FALLBACK,
  ADD_ON_ICONS,
} from '@/features/catalog/constants';
import { formatMonthlyFee } from '@/features/catalog/lib/formatMonthlyFee';
import type { AddOn } from '@/entities/addOn/types';

interface AddOnDetailCardProps {
  addOn: AddOn;
  /**
   * 가입으로 넘어가는 버튼의 동작.
   * 넘기지 않으면 버튼 자체를 그리지 않는다 - PlanDetailCard 와 같은 규칙.
   */
  onJoin?: () => void;
}

/**
 * 부가서비스 하나를 펼쳐 보여주는 상세 내용.
 * 폭·배경·바깥 여백은 감싸는 쪽이 정하고 여기서는 안쪽 간격만 갖는다.
 */
export default function AddOnDetailCard({
  addOn,
  onJoin,
}: AddOnDetailCardProps) {
  // description.icon 값에 맞는 아이콘 (표에 없으면 기본 아이콘)
  const Icon =
    ADD_ON_ICONS[addOn.description?.icon ?? ''] ?? ADD_ON_ICON_FALLBACK;
  const features = addOn.description?.features ?? [];

  return (
    // 본문과 버튼만 넓게 띄우고, 본문 안쪽은 한 값으로 통일한다
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full border border-border-default">
            <Icon
              size={16}
              strokeWidth={1.5}
              className="text-text-primary"
              aria-hidden
            />
          </span>
          <h3 className="min-w-0 truncate text-14 font-medium text-text-primary">
            {addOn.title}
          </h3>
        </div>

        <p className="text-12 leading-fixed text-text-primary">
          {addOn.description?.guide ?? addOn.subTitle}
        </p>

        {/* DATA-012: 일할 계산 기준액이라 '월 요금'이 아니라 기준 금액으로 읽힌다 */}
        <p className="text-12 font-medium text-action-primary">
          {formatMonthlyFee(addOn.baseMonthlyRate)}
        </p>

        {/* 구분선을 섹션과 같이 묶어서, 뒤에 올 내용이 없으면 선도 같이 사라진다 */}
        {features.length > 0 && (
          <>
            <hr className="border-border-default" />

            <section className="flex flex-col gap-2">
              <h4 className="text-12 font-medium text-text-primary">
                서비스 상세
              </h4>
              <ul className="flex list-disc flex-col gap-1.5 pl-4">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="text-10 leading-fixed text-text-secondary"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      {onJoin && (
        <Button
          variant="main"
          radius="sm"
          size="lg"
          isFullWidth
          onClick={onJoin}
        >
          채팅에서 가입하기
        </Button>
      )}
    </div>
  );
}
