// COMMON-001: 목록을 받아오는 동안 보여줄 스켈레톤 UI
export default function CatalogLoading() {
  return (
    <main className="mx-auto flex w-full max-w-(--width-container) flex-col pt-(--height-header) pb-10">
      <div className="flex gap-5 border-b border-border-light-gray bg-neutral-pure-white px-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="my-2 h-5 w-14 rounded-sm bg-border-light-gray"
          />
        ))}
      </div>

      <ul className="flex animate-pulse flex-col gap-3 px-4 py-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <li
            key={index}
            className="h-24 rounded-lg bg-neutral-pure-white shadow-default"
          />
        ))}
      </ul>
    </main>
  );
}
