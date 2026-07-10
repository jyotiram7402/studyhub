export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailProvider {
  id: string;
  send(message: EmailMessage): Promise<void>;
}
