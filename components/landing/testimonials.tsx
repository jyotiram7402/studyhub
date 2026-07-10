import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "Found complete DBMS unit-wise notes two days before my end-sem. The semester and subject filters saved me hours of scrolling through random PDFs.",
    name: "Priya Sharma",
    detail: "BTech CSE, 5th semester",
  },
  {
    quote:
      "I uploaded my Class 12 physics derivation notes and juniors from three different schools messaged me about them. Feels good that they didn't go to waste.",
    name: "Arjun Mehta",
    detail: "Engineering aspirant",
  },
  {
    quote:
      "Previous year question papers for my university were impossible to find online. Here someone had uploaded five years' worth, sorted by semester.",
    name: "Fatima Khan",
    detail: "BCom, University of Mumbai",
  },
];

export function Testimonials() {
  return (
    <section className="container py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Students are already sharing
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          What early contributors say about StudyHub.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <figure
            key={testimonial.name}
            className="flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm"
          >
            <blockquote className="text-sm leading-relaxed text-muted-foreground">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">
                  {getInitials(testimonial.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">{testimonial.detail}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
