type StatTileProps = {
  label: string
  value: string
  deltaPct?: number | null
  deltaLabel?: string
  sparkline?: number[]
}

export default function StatTile({
  label,
  value,
  deltaPct,
  deltaLabel,
  sparkline,
}: StatTileProps) {
  const hasDelta = deltaPct !== undefined
  const isNew = deltaPct === null
  const isPositive = typeof deltaPct === "number" && deltaPct >= 0

  return (
    <div className="border-border bg-card rounded-lg border px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-semibold">{value}</p>
        </div>
        {sparkline && sparkline.length > 1 && <Sparkline values={sparkline} />}
      </div>

      {hasDelta && (
        <p className="text-muted-foreground mt-1.5 font-mono text-xs tabular-nums">
          {isNew ? (
            "Novo"
          ) : (
            <span className={isPositive ? "text-success" : "text-destructive"}>
              {isPositive ? "↑" : "↓"} {Math.abs(deltaPct as number).toFixed(0)}%
            </span>
          )}
          {deltaLabel && <span> {deltaLabel}</span>}
        </p>
      )}
    </div>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  const width = 56
  const height = 28
  const gap = 2
  const barWidth = (width - gap * (values.length - 1)) / values.length

  return (
    <svg
      width={width}
      height={height}
      aria-hidden
      className="mt-0.5 shrink-0"
    >
      {values.map((v, i) => {
        const barHeight = Math.max((v / max) * height, v > 0 ? 3 : 1)
        const isLast = i === values.length - 1
        return (
          <rect
            key={i}
            x={i * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={1.5}
            fill={isLast ? "var(--vz-cobre)" : "var(--vz-marfim-fundo2)"}
          />
        )
      })}
    </svg>
  )
}
