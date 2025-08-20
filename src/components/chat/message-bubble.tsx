"use client"
import React from 'react'
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';

export default function MarkdownRenderer({ content }: { content: string }) {
    return (
        <Markdown
            remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
            rehypePlugins={[rehypeKatex]}
        >
            {content}
        </Markdown>
    )
}