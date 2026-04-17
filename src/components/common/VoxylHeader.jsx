export default function VoxylHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between px-4 pt-12 pb-4">
      <div>
        {subtitle && <p className="text-xs text-muted-foreground mb-0.5">{subtitle}</p>}
        <h1 className="text-2xl font-grotesk font-bold text-foreground">{title}</h1>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}