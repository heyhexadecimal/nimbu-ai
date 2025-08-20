"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type MarkdownRendererProps = {
    content: string
    className?: string
}

/**
 * A robust, safe-by-default Markdown renderer:
 * - GitHub-Flavored Markdown (tables, strikethrough, task lists)
 * - No raw HTML (prevents XSS)
 * - Styled with Tailwind, dark/light aware
 * - Code blocks with copy-to-clipboard
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div
            className={cn(
                // Base typography without requiring @tailwindcss/typography
                "markdown space-y-4 text-sm leading-7",
                // Headings
                "[&>h1]:text-2xl [&>h1]:font-semibold [&>h1]:mt-2 [&>h1]:mb-3",
                "[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-2 [&>h2]:mb-2",
                "[&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-2 [&>h3]:mb-2",
                // Paragraphs and lists
                "[&>p]:text-foreground",
                "[&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6",
                // Blockquote
                "[&>blockquote]:border-l-4 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:border-border",
                // Tables
                "[&>table]:w-full [&>table]:border-collapse [&>th]:border [&>td]:border [&>th]:px-3 [&>th]:py-1.5 [&>td]:px-3 [&>td]:py-1.5 [&>th]:bg-muted [&>th]:text-left [&>th]:text-foreground [&>td]:text-foreground",
                // Horizontal rule
                "[&>hr]:my-4 [&>hr]:border-border",
                // Links
                "[&_a]:text-foreground [&_a]:underline underline-offset-4 hover:opacity-80",
                className,
            )}
        >
            <ReactMarkdown
                // Safe by default: no raw HTML is rendered
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headings adjust spacing slightly in bubbles
                    h1: ({ node, ...props }) => <h1 {...props} />,
                    h2: ({ node, ...props }) => <h2 {...props} />,
                    h3: ({ node, ...props }) => <h3 {...props} />,
                    p: ({ node, ...props }) => <p {...props} />,
                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                    ul: ({ node, ...props }) => <ul {...props} />,
                    ol: ({ node, ...props }) => <ol {...props} />,
                    li: ({ node, ...props }) => <li {...props} />,
                    table: ({ node, ...props }) => <table {...props} />,
                    thead: ({ node, ...props }) => <thead {...props} />,
                    tbody: ({ node, ...props }) => <tbody {...props} />,
                    tr: ({ node, ...props }) => <tr {...props} />,
                    th: ({ node, ...props }) => <th {...props} />,
                    td: ({ node, ...props }) => <td {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote {...props} />,
                    code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || "")
                        const language = match?.[1] || ""
                        const isInline = !className || !className.includes('language-')
                        
                        if (isInline) {
                            return (
                                <code
                                    className={cn(
                                        "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em] text-foreground",
                                        className,
                                    )}
                                    {...props}
                                >
                                    {children}
                                </code>
                            )
                        }
                        return (
                            <CodeBlock language={language} className={className}>
                                {String(children ?? "")}
                            </CodeBlock>
                        )
                    },
                }}
            >
                {content || ""}
            </ReactMarkdown>
        </div>
    )
}

function CodeBlock({
    language,
    className,
    children,
}: {
    language?: string
    className?: string
    children: string
}) {
    const [copied, setCopied] = React.useState(false)

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(children)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch (e) {
            // noop
        }
    }

    return (
        <div className="group relative rounded-lg border border-border bg-muted">
            <div className="absolute right-2 top-2 flex items-center gap-2">
                {language && (
                    <span className="rounded bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {language}
                    </span>
                )}
                <button
                    aria-label="Copy code"
                    onClick={onCopy}
                    className="inline-flex items-center rounded border border-border bg-background px-2 py-1 text-xs text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                    {copied ? (
                        <>
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="mr-1 h-3.5 w-3.5" />
                            Copy
                        </>
                    )}
                </button>
            </div>
            <pre className={cn("overflow-auto p-4 text-[13px]", className)}>
                <code className="font-mono leading-6 text-foreground">{children}</code>
            </pre>
        </div>
    )
}
