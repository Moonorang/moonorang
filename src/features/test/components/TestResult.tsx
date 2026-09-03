'use client';

import Image from 'next/image';

import { Pencil } from 'lucide-react';

import Button from '@/shared/ui/Button';
import Tag from '@/shared/ui/Tag';

import type { AddOn } from '@/entities/addOn/types';
import type { MembershipBrand } from '@/entities/membershipBrand/types';
import type { Plan } from '@/entities/plan/types';

import BenefitList from '@/features/test/components/BenefitList';
import SectionTitle from '@/features/test/components/SectionTitle';
import { useTestResult } from '@/features/test/hooks/useTestResult';
import { selectTypeBenefits } from '@/features/test/lib/selectTypeBenefits';

interface TestResultProps {
  /** 사용자를 부를 이름. auth 는 feature 라 여기서 직접 못 읽고 app 이 넘겨준다 */
  displayName: string;
  /** 요금제 전체. 유형에 어울리는 한 개를 첫 줄에 세운다 */
  plans: Plan[];
  /** U+ 멤버십 제휴 브랜드 전체. 유형에 맞는 카테고리만 골라 쓴다 */
  brands: MembershipBrand[];
  /** 부가서비스 전체. 취미와 맞닿은 것만 골라 쓴다 */
  addOns: AddOn[];
}

/** TEST-007~012: 취미 성향 검사 결과 화면 본문 */
export default function TestResult({
  displayName,
  plans,
  brands,
  addOns,
}: TestResultProps) {
  const { hasAnswer, result, retryTest } = useTestResult();

  // 첫 줄은 어울리는 요금제, 나머지는 혜택 - 순수 계산이라 같은 유형이면 늘 같다
  const benefits = selectTypeBenefits(plans, brands, addOns, result.type.id);

  // 응답이 없으면 훅이 채팅으로 되돌리는 중이므로 아무것도 그리지 않는다
  if (!hasAnswer) return null;

  return (
    <>
      {/* 유형 히어로 (TEST-007) */}
      <div className="mt-5 flex flex-col items-center gap-4 rounded-md bg-linear-to-br from-gradient-from to-gradient-to p-6">
        <Image
          src={result.type.imageSrc}
          alt=""
          width={155}
          height={115}
          className="h-auto max-w-full"
          priority
        />
        <div className="flex w-full flex-col gap-2">
          <h1 className="text-20 font-bold text-background-default">
            {result.type.name}
          </h1>
          <p className="text-14 font-medium text-background-default">
            {result.type.description}
          </p>
        </div>
      </div>

      {/*
        고른 선택지에서 모인 취미 키워드.
        로그인 사용자라면 이 목록이 그대로 활동 로그에도 남는다(TEST-010).
        문항을 전부 건너뛰면 남는 키워드가 없으므로 그때는 아예 그리지 않는다.
      */}
      {result.keywords.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle
            title={`${displayName}님의 취미 키워드`}
            iconSrc="/images/test/icon-plan.png"
            iconWidth={25}
            iconHeight={28}
            iconTone="yellow"
          />
          <div className="flex flex-wrap gap-1.5 rounded-md bg-background-default p-4">
            {result.keywords.map((keyword) => (
              <Tag key={keyword}>#{keyword}</Tag>
            ))}
          </div>
        </section>
      )}

      {/*
        맞춤 요금제·혜택 - 고정 문구 대신 DB 에서 읽은 것을 세 줄로 세운다.
        첫 줄은 어울리는 요금제, 나머지 두 줄은 지금 그대로 누리는 혜택이다
        (U+ 멤버십 제휴 할인, 취미형 부가서비스, 요금제에 딸린 혜택 문구).
        고를 것이 없을 때(조회 실패 등)는 빈 칸 대신 이 자리를 통째로 접는다.
      */}
      {benefits.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle
            title="취미에 어울리는 요금제 및 혜택"
            iconSrc="/images/test/icon-benefit.png"
            iconWidth={30}
            iconHeight={27}
            iconTone="red"
          />
          <BenefitList benefits={benefits} />
        </section>
      )}

      {/*
        재응시 (TEST-012).

        공유하기(TEST-011)는 지금 빼두었다 - 검사 응답이 브라우저 메모리(testStore)에만
        있어서, 링크를 받은 사람은 응답이 없어 결과를 못 보고 채팅으로 튕긴다.
        결과를 링크에 담거나 서버에 저장하게 되면 그때 다시 세운다.
        혼자 남은 버튼이 반쪽으로 보이지 않도록 폭을 가득 채운다.
      */}
      <Button
        variant="main"
        radius="full"
        size="lg"
        gap="md"
        isFullWidth
        onClick={retryTest}
      >
        <Pencil size={16} aria-hidden />
        다시 테스트하기
      </Button>
    </>
  );
}
