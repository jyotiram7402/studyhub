import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalDocument, LEGAL_DOCUMENTS } from "@/lib/legal-content";
import { formatDate } from "@/lib/utils";

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((document) => ({ slug: document.slug }));
}

export async function generateMetadata(props: LegalPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const document = getLegalDocument(slug);
  if (!document) return { title: "Not found" };
  return {
    title: document.title,
    description: document.description,
    alternates: { canonical: `/legal/${document.slug}` },
  };
}

export default async function LegalPage(props: LegalPageProps) {
  const { slug } = await props.params;
  const document = getLegalDocument(slug);
  if (!document) notFound();

  return (
    <div className="container max-w-3xl py-10 md:py-14">
      <nav aria-label="Legal documents" className="mb-8 flex flex-wrap gap-2">
        {LEGAL_DOCUMENTS.map((item) => (
          <Link
            key={item.slug}
            href={`/legal/${item.slug}`}
            aria-current={item.slug === document.slug ? "page" : undefined}
            className={
              item.slug === document.slug
                ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-md bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          >
            {item.title}
          </Link>
        ))}
      </nav>

      <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {formatDate(document.lastUpdated)}
      </p>

      <div className="mt-8 space-y-8">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={index} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
