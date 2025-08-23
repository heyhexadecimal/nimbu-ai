import { cn } from "@/lib/utils"

export function PillButton({
    active,
    onClick,
    icon: Icon,
    label,
    disabled
}: {
    active?: boolean
    onClick?: () => void
    icon: React.ComponentType<{ className?: string }>
    label: string
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={!!active}
            disabled={disabled}
            className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
                "border-border bg-background text-foreground hover:bg-muted",
                active && "border-primary bg-primary/10 text-primary",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
        </button>
    )
}