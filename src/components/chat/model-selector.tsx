import { getModelsForKeys } from "@/lib/models";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function ModelSelector({ model, onChange, keys }: { model: string; onChange: (m: string) => void; keys: any }) {
    const models = getModelsForKeys(keys)
    const currentModelName = models.find(m => m.id === model)?.name || model

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                    aria-label="Select model"
                >
                    <span className="truncate">{currentModelName}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
                {models.map((m) => (
                    <DropdownMenuItem
                        key={m.id}
                        onClick={() => !m.disabled && onChange(m.id)}
                        disabled={m.disabled}
                        className={m.disabled ? "opacity-50 cursor-not-allowed" : ""}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span>{m.name}</span>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}