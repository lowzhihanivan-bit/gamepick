import { cn } from "@/lib/cn";

export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  searchParamsString,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  searchParamsString: string;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams(searchParamsString);
    p === 1 ? params.delete("page") : params.set("page", String(p));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <NavLink href={page > 1 ? href(page - 1) : null} label="← Prev" />

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dot-${i}`} className="px-2 text-ink-faint text-sm">…</span>
        ) : (
          <a
            key={p}
            href={href(p as number)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm border transition-colors",
              p === page
                ? "bg-accent text-bg border-accent font-medium"
                : "bg-bg-soft border-black/8 text-ink-dim hover:border-accent/40"
            )}
          >
            {p}
          </a>
        )
      )}

      <NavLink href={page < totalPages ? href(page + 1) : null} label="Next →" />
    </div>
  );
}

function NavLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm border border-black/8 bg-bg-soft text-ink-dim hover:border-accent/40 transition-colors"
    >
      {label}
    </a>
  );
}

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
