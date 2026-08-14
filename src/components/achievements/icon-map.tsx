import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Crown,
  Feather,
  Flame,
  MapPin,
  Medal,
  Mic,
  Moon,
  Pen,
  RefreshCw,
  Sparkles,
  Sprout,
  Star,
  Sunrise,
  Target,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/** Maps an achievement's `icon` string (kebab-case, see src/content/achievements.ts) to its
 * lucide-react component. Falls back to a generic Award if a new icon slug is added to content
 * without a matching entry here. */
const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  sprout: Sprout,
  "book-open": BookOpen,
  crown: Crown,
  check: Check,
  "check-circle": CheckCircle2,
  star: Star,
  flame: Flame,
  moon: Moon,
  sunrise: Sunrise,
  calendar: Calendar,
  medal: Medal,
  trophy: Trophy,
  "refresh-cw": RefreshCw,
  target: Target,
  "trending-up": TrendingUp,
  mic: Mic,
  pen: Pen,
  feather: Feather,
  "map-pin": MapPin,
};

export function iconForAchievement(icon: string): LucideIcon {
  return ICON_MAP[icon] ?? Award;
}
