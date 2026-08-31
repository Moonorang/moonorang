interface DetailRowProps {
  label: string;
  value: string;
}

// 펼쳤을 때 나오는 상세 항목 한 줄. dl 안에서 쓴다.
export default function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="w-20 shrink-0 text-12 text-text-secondary">{label}</dt>
      <dd className="flex-1 text-12 whitespace-pre-line text-text-primary">
        {value}
      </dd>
    </div>
  );
}
