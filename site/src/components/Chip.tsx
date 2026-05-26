interface Props {
  color?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Chip({ color = "#64748b", children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono ${className}`}
      style={{ background: color + "1f", color }}
    >
      {children}
    </span>
  );
}
