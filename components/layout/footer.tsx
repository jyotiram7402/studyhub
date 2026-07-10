import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { SITE_NAME } from "@/lib/constants";

const footerLinks = [
  {
    heading: "Platform",
    links: [
      { label: "Browse notes", href: "/browse" },
      { label: "Upload notes", href: "/upload" },
      { label: "Question papers", href: "/browse?category=question-papers" },
      { label: "Study material", href: "/browse?category=study-material" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create account", href: "/register" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Settings", href: "/dashboard/settings" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Community guidelines", href: "/legal/guidelines" },
      { label: "Engineering notes", href: "/browse?q=engineering" },
      { label: "UPSC preparation", href: "/browse?q=upsc" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Copyright Policy", href: "/legal/copyright" },
      { label: "Refund Policy", href: "/legal/refunds" },
      { label: "Cookie Policy", href: "/legal/cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Study notes, question papers, and projects shared by students from
              every university, board, and exam stream.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.heading}>
              <h3 className="text-sm font-semibold">{group.heading}</h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {SITE_NAME}. Built by students, for students.
          </p>
          <p className="text-sm text-muted-foreground">Made for learners everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
