export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  college: string | null;
  course: string | null;
  semester: string | null;
  role: "user" | "admin";
  is_verified: boolean;
  status: "active" | "suspended";
  points: number;
  referral_code: string;
  created_at: string;
  updated_at: string;
}

export interface University {
  id: string;
  name: string;
  country: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface Note {
  id: string;
  uploader_id: string;
  title: string;
  description: string;
  category_id: string;
  university_id: string | null;
  course_id: string | null;
  subject_id: string | null;
  college: string | null;
  board: string | null;
  semester: string | null;
  department: string | null;
  language: string;
  price: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  thumbnail_path: string | null;
  preview_pages: number;
  views: number;
  downloads: number;
  bookmarks_count: number;
  status: "published" | "draft";
  discount_percent: number;
  version: string | null;
  edition: string | null;
  visibility: "public" | "private";
  moderation_status: "approved" | "pending" | "hidden" | "removed";
  sales_count: number;
  rating_avg: number;
  rating_count: number;
  ai_status: "pending" | "processing" | "completed" | "failed" | "skipped";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  reading_time_minutes: number | null;
  quality_score: number | null;
  plagiarism_score: number;
  plagiarism_note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteWithRelations extends Note {
  uploader: Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "is_verified">;
  category: Pick<Category, "id" | "name" | "slug">;
  university: Pick<University, "id" | "name"> | null;
  course: Pick<Course, "id" | "name"> | null;
  subject: Pick<Subject, "id" | "name"> | null;
  featured: { kind: "featured" | "editors_choice" } | null;
}

export interface NoteFilters {
  q?: string;
  category?: string;
  university?: string;
  course?: string;
  subject?: string;
  semester?: string;
  department?: string;
  language?: string;
  fileType?: string;
  price?: "free" | "paid";
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "popular" | "views" | "bestseller" | "rating";
  page?: number;
}

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
export type PaymentStatus = "created" | "succeeded" | "failed" | "refunded";

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  tax: number;
  total: number;
  currency: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  note_id: string;
  seller_id: string;
  title: string;
  unit_price: number;
  discount_percent: number;
  final_price: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  provider_payment_id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: string;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  buyer_id: string;
  note_id: string;
  order_id: string;
  order_item_id: string | null;
  price_paid: number;
  created_at: string;
}

export interface PurchaseWithNote extends Purchase {
  note: NoteWithRelations;
}

export interface SellerWallet {
  seller_id: string;
  balance: number;
  total_earned: number;
  total_sales: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  seller_id: string;
  type: "sale" | "refund" | "payout";
  amount: number;
  order_id: string | null;
  note_id: string | null;
  description: string | null;
  created_at: string;
}

export interface SalesReport {
  id: string;
  seller_id: string;
  period: string;
  sales_count: number;
  revenue: number;
  downloads_count: number;
}

export type ReportReason =
  | "spam"
  | "wrong_content"
  | "duplicate"
  | "copyright"
  | "abusive"
  | "broken_file"
  | "other";

export interface Review {
  id: string;
  note_id: string;
  reviewer_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithReviewer extends Review {
  reviewer: Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "is_verified">;
}

export interface Rating {
  note_id: string;
  average: number;
  count: number;
  star_1: number;
  star_2: number;
  star_3: number;
  star_4: number;
  star_5: number;
}

export interface ContentReport {
  id: string;
  note_id: string;
  reporter_id: string;
  reason: ReportReason;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  action_taken: string | null;
  resolution_note: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface SellerVerification {
  id: string;
  seller_id: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface FeaturedProduct {
  id: string;
  note_id: string;
  kind: "featured" | "editors_choice";
  featured_by: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  platform_name: string;
  logo_url: string | null;
  commission_percent: number;
  max_upload_size_mb: number;
  allowed_file_types: string[];
  maintenance_mode: boolean;
  updated_at: string;
}

export interface AnalyticsDay {
  id: string;
  day: string;
  new_users: number;
  uploads_count: number;
  downloads_count: number;
  orders_count: number;
  revenue: number;
}

export interface NoteSummary {
  id: string;
  note_id: string;
  short_summary: string;
  key_topics: string[];
  important_points: string[];
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  reading_time_minutes: number | null;
  quality_score: number | null;
  quality_factors: {
    completeness: number;
    formatting: number;
    readability: number;
    topic_coverage: number;
  } | null;
  auto_tags: string[];
  detected: {
    department: string | null;
    semester: string | null;
    course: string | null;
    technology: string | null;
    programming_language: string | null;
  } | null;
  created_at: string;
}

export interface AiChatSession {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  note_id: string | null;
  question: string;
  answer: string;
  review_count: number;
  last_reviewed_at: string | null;
  created_at: string;
}

export interface QuizQuestionRecord {
  type: "mcq" | "short_answer" | "long_answer" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string;
  questions: QuizQuestionRecord[];
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
