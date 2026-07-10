import {
  FileArchive,
  FileImage,
  FileText,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, { icon: LucideIcon; className: string }> = {
  pdf: { icon: FileText, className: "text-red-500" },
  doc: { icon: FileText, className: "text-blue-500" },
  docx: { icon: FileText, className: "text-blue-500" },
  ppt: { icon: Presentation, className: "text-orange-500" },
  pptx: { icon: Presentation, className: "text-orange-500" },
  zip: { icon: FileArchive, className: "text-amber-500" },
  png: { icon: FileImage, className: "text-emerald-500" },
  jpg: { icon: FileImage, className: "text-emerald-500" },
  jpeg: { icon: FileImage, className: "text-emerald-500" },
  webp: { icon: FileImage, className: "text-emerald-500" },
};

export function FileTypeIcon({
  fileType,
  className,
}: {
  fileType: string;
  className?: string;
}) {
  const entry = iconMap[fileType] ?? iconMap.pdf;
  const Icon = entry.icon;
  return <Icon className={cn(entry.className, className)} />;
}
