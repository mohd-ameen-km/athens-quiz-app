"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema, Options as SanitizeOptions } from "rehype-sanitize";
import { cn } from "@/lib/utils";

export const ALLOWED_RICH_TEXT_TAGS = [
  "p",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "sup",
  "sub",
  "br",
] as const;

export const RICH_TEXT_SANITIZE_SCHEMA: SanitizeOptions = {
  ...defaultSchema,
  tagNames: [...ALLOWED_RICH_TEXT_TAGS],
  attributes: {},
  strip: ["script", "style", "iframe", "object", "embed"],
};

export interface RichTextProps {
  text?: string;
  content?: string;
  children?: string;
  className?: string;
}

export function RichText({ text, content, children, className }: RichTextProps) {
  const raw = text ?? content ?? children ?? "";
  const normalized = String(raw).replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\\n/g, "\n");

  return (
    <div
      className={cn(
        "space-y-4 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, RICH_TEXT_SANITIZE_SCHEMA]]}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

export default RichText;
