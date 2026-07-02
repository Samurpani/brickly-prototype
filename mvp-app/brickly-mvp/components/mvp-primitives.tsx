import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function Panel({
  title,
  subtitle,
  children,
  delay = 0,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <Card className="rise overflow-hidden" style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,244,238,0.82))]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="display-font text-lg font-semibold">{title}</h3>
            {subtitle ? <p className="text-sm text-[var(--muted)]">{subtitle}</p> : null}
          </div>
          <Badge tone="neutral">MVP</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )
}

export function MetricGrid({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: "base" | "ok" | "warn" }>
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.7))]">
          <CardContent className="p-3">
            <p className="text-xs text-[var(--muted)]">{item.label}</p>
            <p
              className={`display-font mt-1 text-2xl font-semibold ${
                item.tone === "ok"
                  ? "text-[var(--ok)]"
                  : item.tone === "warn"
                    ? "text-[var(--warn)]"
                    : "text-[var(--ink)]"
              }`}
            >
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function Pill({
  text,
  tone = "base",
}: {
  text: string
  tone?: "base" | "ok" | "warn"
}) {
  const variant = tone === "ok" ? "success" : tone === "warn" ? "warning" : "neutral"
  return <Badge tone={variant as "neutral" | "success" | "warning" | "accent"}>{text}</Badge>
}
