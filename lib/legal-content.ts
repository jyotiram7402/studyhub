export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDocument {
  slug: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    description: "The rules for using the StudyHub marketplace.",
    lastUpdated: "2026-07-01",
    sections: [
      {
        heading: "Acceptance of terms",
        paragraphs: [
          "By creating an account or using StudyHub you agree to these terms. If you do not agree, do not use the service. You must be at least 13 years old, or the minimum digital-consent age in your country, to create an account.",
        ],
      },
      {
        heading: "The service",
        paragraphs: [
          "StudyHub is a marketplace where students upload, share, and sell study material. We host content on behalf of sellers and facilitate transactions; we do not author or endorse listed material.",
          "Payments currently operate in test mode. When production payments launch, additional payment terms will apply and will be announced in advance.",
        ],
      },
      {
        heading: "Your account",
        paragraphs: [
          "You are responsible for your account credentials and all activity under your account. Accounts that violate these terms, our Community Guidelines, or applicable law may be suspended or removed.",
        ],
      },
      {
        heading: "Seller obligations",
        paragraphs: [
          "Sellers may only upload material they created or have the right to distribute. Sellers set their own prices and receive earnings net of the platform commission shown at the time of sale. StudyHub may remove listings that break our policies.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "StudyHub is provided on an as-is basis. To the maximum extent permitted by law, we are not liable for indirect or consequential damages, loss of data, or academic outcomes arising from use of purchased material.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "What we collect, why, and how it is protected.",
    lastUpdated: "2026-07-01",
    sections: [
      {
        heading: "Data we collect",
        paragraphs: [
          "Account data: email address, name, username, and the optional profile details you add (college, course, bio, photo).",
          "Usage data: uploads, purchases, downloads, bookmarks, reviews, searches, and page views. This powers your library, seller analytics, and recommendations.",
          "We do not collect payment card details; in test mode no real payment information exists, and production payments will be handled by a PCI-compliant provider.",
        ],
      },
      {
        heading: "How we use data",
        paragraphs: [
          "To operate the marketplace (deliver purchases, credit sellers, prevent fraud), to personalise recommendations and search, and to send transactional notifications inside the app.",
          "AI features process document content and your questions through Google's Gemini API to generate summaries, answers, and study tools. Documents are only processed for search indexing and for users who already have access to them.",
        ],
      },
      {
        heading: "Storage and security",
        paragraphs: [
          "Data is stored in Supabase (PostgreSQL and object storage) with row-level security so users can only read what they are entitled to. Files are served through short-lived signed URLs.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "You can edit your profile at any time, delete your uploads, and request full account deletion, which removes your profile, uploads, and personal data. Contact support from your registered email to exercise these rights.",
        ],
      },
    ],
  },
  {
    slug: "copyright",
    title: "Copyright Policy",
    description: "How we handle intellectual property on StudyHub.",
    lastUpdated: "2026-07-01",
    sections: [
      {
        heading: "Ownership",
        paragraphs: [
          "Uploaders retain ownership of their material. By publishing on StudyHub you grant us a licence to host, display, and deliver it to buyers, and to process it for search and AI features.",
        ],
      },
      {
        heading: "Prohibited uploads",
        paragraphs: [
          "Do not upload textbooks, publisher solution manuals, paid course content, or any material you do not have the right to distribute. Automated duplicate detection and human moderation both act on infringing uploads.",
        ],
      },
      {
        heading: "Reporting infringement",
        paragraphs: [
          "Rights holders can report infringing content using the Report button on any listing (choose Copyright issue) with details identifying the original work. Verified reports result in removal of the listing, and repeat infringers lose their accounts.",
        ],
      },
    ],
  },
  {
    slug: "refunds",
    title: "Refund Policy",
    description: "When purchases on StudyHub can be refunded.",
    lastUpdated: "2026-07-01",
    sections: [
      {
        heading: "Digital goods",
        paragraphs: [
          "All listings are digital downloads with instant delivery, so purchases are generally final once the file has been downloaded.",
        ],
      },
      {
        heading: "When refunds apply",
        paragraphs: [
          "You are eligible for a refund if the file is corrupted or unreadable, if the content is materially different from its title and description, or if the listing is removed for a policy violation after your purchase.",
          "Report the problem within 7 days of purchase using the Report button (choose Broken file or Wrong content). Approved refunds are returned to the original payment method once production payments are live; in test mode no real money moves.",
        ],
      },
    ],
  },
  {
    slug: "guidelines",
    title: "Community Guidelines",
    description: "How we keep StudyHub useful and safe.",
    lastUpdated: "2026-07-01",
    sections: [
      {
        heading: "Be genuinely helpful",
        paragraphs: [
          "Upload material that is accurate, complete, and honestly described. Choose the right subject, course, and semester so other students can find it.",
        ],
      },
      {
        heading: "Not allowed",
        paragraphs: [
          "Plagiarised or pirated content, spam or duplicate listings, misleading titles, abusive or discriminatory content, exam malpractice material (leaked live papers), and manipulation of reviews or ratings.",
        ],
      },
      {
        heading: "Reviews",
        paragraphs: [
          "Review only material you have actually used. Rate the content, not the seller personally. Fake or incentivised reviews are removed and penalised.",
        ],
      },
      {
        heading: "Enforcement",
        paragraphs: [
          "Violations lead to content removal, warnings, suspension, or permanent bans depending on severity. Moderation decisions can be appealed by replying to the notification you receive.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    description: "The cookies StudyHub sets and why.",
    lastUpdated: "2026-07-01",
    sections: [
      {
        heading: "Essential cookies",
        paragraphs: [
          "We set authentication cookies (Supabase session tokens) to keep you signed in securely. These are strictly necessary and cannot be disabled while using an account.",
        ],
      },
      {
        heading: "Preferences and analytics",
        paragraphs: [
          "Your theme choice (light or dark) is stored locally in your browser. Vercel Analytics collects anonymous, cookie-free page-view metrics to help us improve performance; it does not track you across sites.",
        ],
      },
      {
        heading: "Third parties",
        paragraphs: [
          "We do not use advertising cookies or sell data to third parties.",
        ],
      },
    ],
  },
];

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug);
}
