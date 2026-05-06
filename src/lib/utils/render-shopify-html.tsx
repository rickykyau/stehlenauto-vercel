import { createElement, Fragment, type ReactNode } from "react";

/**
 * Render Shopify's `descriptionHtml` as React with a strict tag whitelist.
 *
 * Cycle 14f (Mike-6 MAJOR F-7): the previous plain-text parser collapsed
 * bullet-style "Title: text Title: text" patterns into one runon paragraph.
 * Shopify's descriptionHtml has the real `<ul>`, `<li>`, `<strong>`, `<p>`,
 * `<br>` structure already — render it directly so each bullet keeps its own
 * line. We strip every attribute and every tag outside the whitelist, so the
 * customer cannot inject `<script>`, `onclick=`, links, etc. via product copy.
 */

const ALLOWED = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span",
  "div",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
]);

const VOID = new Set(["br", "hr", "img"]);

type Node =
  | { type: "text"; value: string }
  | { type: "el"; tag: string; children: Node[] };

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function tokenize(html: string): Node[] {
  const root: Node = { type: "el", tag: "root", children: [] };
  const stack: Node[] = [root];
  let i = 0;

  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      const text = decode(html.slice(i));
      if (text.trim()) {
        const top = stack[stack.length - 1] as { type: "el"; children: Node[] };
        top.children.push({ type: "text", value: text });
      }
      break;
    }
    if (lt > i) {
      const text = decode(html.slice(i, lt));
      const top = stack[stack.length - 1] as { type: "el"; children: Node[] };
      top.children.push({ type: "text", value: text });
    }
    const gt = html.indexOf(">", lt);
    if (gt === -1) break;
    const raw = html.slice(lt + 1, gt).trim();
    i = gt + 1;
    if (!raw) continue;
    if (raw.startsWith("!--")) continue;
    if (raw.startsWith("/")) {
      const tag = raw.slice(1).split(/\s/)[0]!.toLowerCase();
      // pop until matching tag
      for (let j = stack.length - 1; j > 0; j--) {
        if ((stack[j] as { tag: string }).tag === tag) {
          stack.length = j;
          break;
        }
      }
      continue;
    }
    const selfClose = raw.endsWith("/");
    const tag = raw.replace(/\/$/, "").split(/\s/)[0]!.toLowerCase();
    if (!ALLOWED.has(tag)) {
      // strip tag but keep its text content (the loop will handle inner content)
      continue;
    }
    const el: Node = { type: "el", tag, children: [] };
    const top = stack[stack.length - 1] as { type: "el"; children: Node[] };
    top.children.push(el);
    if (!selfClose && !VOID.has(tag)) stack.push(el);
  }

  return (root as { children: Node[] }).children;
}

function toReact(nodes: Node[], keyPrefix = "n"): ReactNode {
  return nodes.map((n, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (n.type === "text") return <Fragment key={key}>{n.value}</Fragment>;
    if (VOID.has(n.tag)) return createElement(n.tag, { key });
    return createElement(n.tag, { key }, toReact(n.children, key));
  });
}

export function renderShopifyHtml(html: string): ReactNode {
  if (!html || !html.trim()) return null;
  return toReact(tokenize(html));
}
