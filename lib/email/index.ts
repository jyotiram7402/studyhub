import type { EmailMessage, EmailProvider } from "@/lib/email/types";

// Swap in a real provider (Resend, SES, Postmark) by implementing
// EmailProvider and selecting it via EMAIL_PROVIDER without touching callers.
const consoleProvider: EmailProvider = {
  id: "console",
  async send(message: EmailMessage) {
    console.info(`[email:${this.id}] to=${message.to} subject="${message.subject}"`);
  },
};

const providers: Record<string, EmailProvider> = {
  console: consoleProvider,
};

export async function sendEmail(message: EmailMessage): Promise<void> {
  const providerId = process.env.EMAIL_PROVIDER ?? "console";
  const provider = providers[providerId] ?? consoleProvider;
  try {
    await provider.send(message);
  } catch (error) {
    console.error(`[email:${provider.id}] delivery failed`, error);
  }
}
