export const SITE_NAME = "StudyHub";
export const SITE_DESCRIPTION =
  "A marketplace where students upload, discover, and share study notes, question papers, projects, and more.";

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;

export const ACCEPTED_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "zip",
  "png",
  "jpg",
  "jpeg",
  "webp",
] as const;

export const ACCEPTED_FILE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const ACCEPTED_THUMBNAIL_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Bengali",
  "Gujarati",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Other",
] as const;

export const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
  "Year 1",
  "Year 2",
  "Year 3",
  "Not Applicable",
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Downloaded" },
  { value: "views", label: "Most Viewed" },
  { value: "bestseller", label: "Best Sellers" },
  { value: "rating", label: "Highest Rated" },
] as const;

export const CURRENCY = "INR";
export const CURRENCY_SYMBOL = "₹";
export const MAX_NOTE_PRICE = 99999;

export const NOTE_VISIBILITY_OPTIONS = [
  { value: "public", label: "Public — visible in search and browse" },
  { value: "private", label: "Private — only visible to you" },
] as const;

export const NOTES_PAGE_SIZE = 12;

export const STORAGE_BUCKETS = {
  noteFiles: "note-files",
  thumbnails: "thumbnails",
} as const;
