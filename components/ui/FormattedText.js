import React from "react"

/**
 * Renders a string containing basic Markdown-like syntax safely.
 * Supported: **bold**, *italic* or _italic_, ^superscript^
 */
export const FormattedText = ({ text }) => {
  if (!text) return null

  const sanitizedContent = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold: **text**
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    // Italic: *text* or _text_
    .replace(/\*([^*]+)\*/g, "<i>$1</i>")
    .replace(/_([^_]+)_/g, "<i>$1</i>")
    // Superscript: ^text^
    .replace(/\^([^^]+)\^/g, "<sup>$1</sup>")
    // Line breaks
    .replace(/\n/g, "<br/>")

  return (
    <span
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      className="whitespace-pre-wrap break-words"
    />
  )
}
