import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { RichText } from "./RichText";

describe("RichText component", () => {
  it("renders a two-paragraph string containing **bold** and *italic* into two <p> elements plus <strong> and <em>", () => {
    const input = "First paragraph with **bold** text.\n\nSecond paragraph with *italic* text.";
    const html = renderToStaticMarkup(<RichText text={input} />);

    const paragraphs = html.match(/<p>/g) ?? [];
    expect(paragraphs).toHaveLength(2);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<p>First paragraph with <strong>bold</strong> text.</p>");
    expect(html).toContain("<p>Second paragraph with <em>italic</em> text.</p>");
  });

  it("renders single newlines as <br> line breaks and _italic_ as <em>", () => {
    const input = "Line one with _italic_\nLine two";
    const html = renderToStaticMarkup(<RichText text={input} />);

    expect(html.match(/<p>/g)).toHaveLength(1);
    expect(html).toContain("<em>italic</em>");
    expect(html).toMatch(/<br\s*\/?>/);
  });

  it("renders allowed HTML tags (b, strong, i, em, u, sup, sub, br) and strips disallowed tags, scripts, iframes, event handlers, and styles", () => {
    const input =
      '<b>Bold</b> <strong>Strong</strong> <i>Italic</i> <em>Em</em> <u>Underline</u> x<sup>2</sup> H<sub>2</sub>O<br>Next line <script>alert("xss")</script><iframe src="https://evil.com"></iframe><b onclick="evil()" style="color:red">SafeBold</b>';
    const html = renderToStaticMarkup(<RichText text={input} />);

    expect(html).toContain("<b>Bold</b>");
    expect(html).toContain("<strong>Strong</strong>");
    expect(html).toContain("<i>Italic</i>");
    expect(html).toContain("<em>Em</em>");
    expect(html).toContain("<u>Underline</u>");
    expect(html).toContain("<sup>2</sup>");
    expect(html).toContain("<sub>2</sub>");
    expect(html).toMatch(/<br\s*\/?>/);
    expect(html).toContain("<b>SafeBold</b>");

    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("style=");
  });

  it("renders plain text with no markers unchanged inside a paragraph", () => {
    const plain = "Which philosopher taught Alexander the Great?";
    const html = renderToStaticMarkup(<RichText text={plain} />);

    expect(html).toContain(`<p>${plain}</p>`);
  });
});
