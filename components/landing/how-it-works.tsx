const steps = [
  {
    step: "01",
    title: "Create your free account",
    description:
      "Sign up with your email in under a minute. Add your college, course, and semester so classmates can find you.",
  },
  {
    step: "02",
    title: "Upload or discover material",
    description:
      "Publish your notes with a title, subject, and tags — or search thousands of uploads filtered to your exact course.",
  },
  {
    step: "03",
    title: "Download and bookmark",
    description:
      "Grab what you need for exam week and bookmark the rest. Your dashboard keeps everything in one place.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three steps between you and better study material.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="relative rounded-xl border bg-card p-6 shadow-sm">
              <span className="text-sm font-semibold text-primary">{item.step}</span>
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
