import { cn } from "@/lib/utils"

export function PillButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active?: boolean
    onClick?: () => void
    icon: React.ComponentType<{ className?: string }>
    label: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={!!active}
            className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
                "border-border bg-background text-foreground hover:bg-muted",
                active && "border-primary bg-primary/10 text-primary",
            )}
        >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
        </button>
    )
}