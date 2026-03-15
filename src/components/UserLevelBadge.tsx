import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserXpData } from "@/hooks/useUserXp";

interface UserLevelBadgeProps {
  avatarUrl?: string | null;
  fullName: string;
  xpData: UserXpData;
  size?: number;
  children?: React.ReactNode;
}

export default function UserLevelBadge({ avatarUrl, fullName, xpData, size = 64, children }: UserLevelBadgeProps) {
  const { level, progress, totalXp, nextLevelXp } = xpData;
  const strokeWidth = 3;
  const svgSize = size + strokeWidth * 2 + 8;
  const radius = size / 2 + 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const getInitials = (name: string) =>
    name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        {/* SVG circular progress */}
        <svg
          width={svgSize}
          height={svgSize}
          className="absolute inset-0 -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Avatar centered */}
        <div
          className="absolute"
          style={{
            top: strokeWidth + 4,
            left: strokeWidth + 4,
            width: size,
            height: size,
          }}
        >
          <div className="relative w-full h-full group">
            <Avatar className="w-full h-full border-2 border-accent">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground font-heading">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            {children}
          </div>
        </div>
        {/* Level badge */}
        <div
          className="absolute flex items-center justify-center bg-accent text-accent-foreground rounded-full font-heading font-bold text-xs border-2 border-background"
          style={{
            width: 24,
            height: 24,
            bottom: 0,
            right: 0,
          }}
        >
          {level}
        </div>
      </div>
      <div>
        {/* Name and level info rendered by parent */}
      </div>
    </div>
  );
}
