import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Point = { label: string; value: number };

type MarketShareChartProps = {
  title: string;
  description: string;
  data: Point[];
  suffix?: string;
  min?: number;
  max?: number;
  source?: string;
  type?: "line" | "bar";
};

export function MarketShareChart({
  title, description, data, suffix = "%", min, max, source, type = "line",
}: MarketShareChartProps) {
  const values = data.map((point) => point.value);
  const floor = min ?? Math.min(...values);
  const ceiling = max ?? Math.max(...values);
  const range = Math.max(ceiling - floor, 0.1);
  const width = 720;
  const height = 260;
  const padding = { top: 24, right: 24, bottom: 52, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const x = (index: number) => padding.left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const y = (value: number) => padding.top + ((ceiling - value) / range) * plotHeight;
  const points = data.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const grid = Array.from({ length: 5 }, (_, index) => ({
    value: ceiling - (range / 4) * index,
    y: padding.top + (plotHeight / 4) * index,
  }));

  return (
    <Card className="not-prose my-8 border border-border bg-card/50">
      <CardHeader className="gap-1 p-5 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${description}`} className="min-w-[620px] w-full">
            {grid.map((tick) => (
              <g key={tick.y}>
                <line x1={padding.left} x2={width - padding.right} y1={tick.y} y2={tick.y} className="stroke-border" strokeWidth="1" />
                <text x={padding.left - 10} y={tick.y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                  {tick.value.toFixed(range < 5 ? 1 : 0)}{suffix}
                </text>
              </g>
            ))}
            {type === "line" ? (
              <>
                <polyline points={points} fill="none" className="stroke-foreground" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                {data.map((point, index) => (
                  <circle key={point.label} cx={x(index)} cy={y(point.value)} r="4" className="fill-background stroke-foreground" strokeWidth="2" />
                ))}
              </>
            ) : data.map((point, index) => {
              const slot = plotWidth / data.length;
              const barWidth = Math.min(slot * 0.58, 72);
              const barX = padding.left + index * slot + (slot - barWidth) / 2;
              const barY = y(point.value);
              return <rect key={point.label} x={barX} y={barY} width={barWidth} height={padding.top + plotHeight - barY} rx="4" className="fill-foreground" />;
            })}
            {data.map((point, index) => {
              const labelX = type === "bar" ? padding.left + (index + 0.5) * (plotWidth / data.length) : x(index);
              return (
                <g key={`${point.label}-label`}>
                  <text x={labelX} y={height - 26} textAnchor="middle" className="fill-muted-foreground text-[10px]">{point.label}</text>
                  <text x={labelX} y={Math.max(y(point.value) - 9, 13)} textAnchor="middle" className="fill-foreground text-[10px] font-medium">{point.value}{suffix}</text>
                </g>
              );
            })}
          </svg>
        </div>
        {source ? <p className="mt-2 text-xs text-muted-foreground">Source: {source}</p> : null}
      </CardContent>
    </Card>
  );
}
