import {
  Award,
  BadgeCheck,
  Download,
  Flame,
  GraduationCap,
  Star,
  Trophy,
  Upload,
  type LucideIcon,
} from "lucide-react";

export interface Level {
  level: number;
  name: string;
  minPoints: number;
}

export const LEVELS: Level[] = [
  { level: 1, name: "Fresher", minPoints: 0 },
  { level: 2, name: "Note Taker", minPoints: 50 },
  { level: 3, name: "Contributor", minPoints: 150 },
  { level: 4, name: "Scholar", minPoints: 400 },
  { level: 5, name: "Mentor", minPoints: 1000 },
  { level: 6, name: "Campus Legend", minPoints: 2500 },
];

export function getLevel(points: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.minPoints) current = level;
  }
  return current;
}

export function getNextLevel(points: number): Level | null {
  return LEVELS.find((level) => level.minPoints > points) ?? null;
}

export interface ContributorStats {
  uploadCount: number;
  salesCount: number;
  downloadCount: number;
  reviewCount: number;
  ratingAvg: number;
  isVerified: boolean;
  points: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  earned: boolean;
}

export function getAchievements(stats: ContributorStats): Achievement[] {
  return [
    {
      id: "first-upload",
      name: "First Upload",
      description: "Published your first study material",
      icon: Upload,
      earned: stats.uploadCount >= 1,
    },
    {
      id: "prolific",
      name: "Prolific Contributor",
      description: "Published 10 or more uploads",
      icon: GraduationCap,
      earned: stats.uploadCount >= 10,
    },
    {
      id: "first-sale",
      name: "First Sale",
      description: "Sold your first resource",
      icon: Flame,
      earned: stats.salesCount >= 1,
    },
    {
      id: "best-seller",
      name: "Best Seller",
      description: "Reached 25 total sales",
      icon: Trophy,
      earned: stats.salesCount >= 25,
    },
    {
      id: "crowd-favorite",
      name: "Crowd Favorite",
      description: "Your uploads passed 100 downloads",
      icon: Download,
      earned: stats.downloadCount >= 100,
    },
    {
      id: "top-rated",
      name: "Top Rated",
      description: "Maintained a 4.5+ average rating",
      icon: Star,
      earned: stats.ratingAvg >= 4.5 && stats.reviewCount >= 3,
    },
    {
      id: "verified",
      name: "Verified Seller",
      description: "Identity verified by the StudyHub team",
      icon: BadgeCheck,
      earned: stats.isVerified,
    },
    {
      id: "top-contributor",
      name: "Top Contributor",
      description: "Earned 1000+ contribution points",
      icon: Award,
      earned: stats.points >= 1000,
    },
  ];
}
