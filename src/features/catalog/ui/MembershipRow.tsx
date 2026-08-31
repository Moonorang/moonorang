import {
  Dumbbell,
  Film,
  Gift,
  Sparkles,
  Store,
  UtensilsCrossed,
} from 'lucide-react';

import CatalogCard from '@/features/catalog/ui/CatalogCard';
import DetailRow from '@/features/catalog/ui/DetailRow';
import Tag from '@/shared/ui/Tag';

import type { MembershipBrand } from '@/entities/membershipBrand/types';

// 멤버십 카테고리별 아이콘. 브랜드 아이콘 파일(membership_brands.icon)은
// 아직 public 에 없어서 카테고리 아이콘으로 대체한다.
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  '문화/여가': Film,
  푸드: UtensilsCrossed,
  '생활/편의': Store,
  액티비티: Dumbbell,
  '뷰티/건강': Sparkles,
};

interface MembershipRowProps {
  brand: MembershipBrand;
  isExpanded: boolean;
  onToggle: () => void;
}

// DATA-018: 태그·제휴사명·혜택
export default function MembershipRow({
  brand,
  isExpanded,
  onToggle,
}: MembershipRowProps) {
  const CategoryIcon = CATEGORY_ICONS[brand.category] ?? Gift;
  const summary = brand.discountRules?.summary;
  const detail = brand.discountRules?.detail;
  const hasDetail = !!detail?.provided_count || !!detail?.instructions?.length;

  return (
    <CatalogCard
      expandSummary={hasDetail ? '혜택 이용 조건' : undefined}
      isExpanded={isExpanded}
      onToggle={onToggle}
      detail={
        hasDetail ? (
          <div className="flex flex-col gap-2">
            {detail?.provided_count && (
              <dl>
                <DetailRow
                  label="제공 횟수"
                  value={detail.provided_count.trim()}
                />
              </dl>
            )}
            {!!detail?.instructions?.length && (
              <ul className="flex flex-col gap-1">
                {detail.instructions.map((instruction) => (
                  <li key={instruction} className="text-12 text-text-secondary">
                    {instruction}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action-secondary-light text-action-secondary">
          <CategoryIcon size={20} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-14 font-semibold text-text-primary">
              {brand.name}
            </p>
            <Tag>{brand.category}</Tag>
          </div>
          {summary && (
            <p className="text-12 whitespace-pre-line text-text-secondary">
              {summary}
            </p>
          )}
        </div>
      </div>
    </CatalogCard>
  );
}
