import { CategoriesSection } from "@/components/landing/categories-section";
import { Cta } from "@/components/landing/cta";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PopularSubjects } from "@/components/landing/popular-subjects";
import { Testimonials } from "@/components/landing/testimonials";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <>
      <Hero />
      <Features />
      <CategoriesSection categories={categories ?? []} />
      <PopularSubjects />
      <HowItWorks />
      <Testimonials />
      <Faq />
      <Cta />
    </>
  );
}
