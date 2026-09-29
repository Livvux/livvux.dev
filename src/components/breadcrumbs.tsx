import Link from "next/link";
import { breadcrumbStructuredData, type BreadcrumbItem } from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";

export function Breadcrumbs({ items, label = "Breadcrumb" }: { items: readonly BreadcrumbItem[]; label?: string }) {
  return (
    <>
      <StructuredData data={breadcrumbStructuredData(items)} />
      <nav aria-label={label} className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => (
            <li key={item.href} className="inline-flex items-center gap-2 break-words">
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === items.length - 1 ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link href={item.href} className="underline-offset-4 hover:underline focus-visible:underline">{item.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
