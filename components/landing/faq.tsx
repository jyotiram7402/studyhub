import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is StudyHub free to use?",
    answer:
      "Browsing and creating an account are free, and sellers choose whether their material is free or paid. Free notes stay free forever; paid notes unlock instantly after checkout. Payments currently run in secure test mode while production gateways are being finalised.",
  },
  {
    question: "How do I earn from my notes?",
    answer:
      "Set a price (and an optional discount) when you upload. Every sale is credited to your seller wallet instantly, and your seller dashboard tracks revenue, orders, and monthly earnings. Payouts to your bank account arrive with the production payment gateway.",
  },
  {
    question: "What file types can I upload?",
    answer:
      "PDF, Word documents (DOC/DOCX), presentations (PPT/PPTX), images (PNG/JPG/WEBP), and ZIP archives for multi-file projects. Files can be up to 50 MB.",
  },
  {
    question: "Which universities and boards are supported?",
    answer:
      "All of them. StudyHub is open to students from any school, board, college, or university worldwide — from Class 11 and Class 12 to engineering, medical, commerce, and government exam preparation.",
  },
  {
    question: "Who owns the notes I upload?",
    answer:
      "You do. You should only upload material you created or have the right to share, and you can delete your uploads at any time from your dashboard.",
  },
  {
    question: "Do I need an account to download?",
    answer:
      "You can browse and search without an account, but downloading and bookmarking require a free account so we can keep files secure and let uploaders see how their material is doing.",
  },
];

export function Faq() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mx-auto mt-10 max-w-2xl space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border bg-card px-5 shadow-sm [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium">
                {faq.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
