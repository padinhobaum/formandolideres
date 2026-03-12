interface SalaBadgeProps {
  className?: string;
  sala?: string | null;
}

export default function SalaBadge({ sala, className = "" }: SalaBadgeProps) {
  if (!sala) return null;
  return (
    <span
      className={`inline-flex items-center text-[10px] font-body font-medium px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground leading-none whitespace-nowrap ${className}`}
    >
      {sala}
    </span>
  );
}
