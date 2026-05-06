# Screenshots

Curated UI captures from each phase of development. Only commit when they prove
a feature works or document a visual decision — not every Playwright run output.

| Folder | Contents |
| --- | --- |
| `phase-1/` | Initial chrome + home (announcement bar, mega-nav, mobile menu) |
| `phase-2/` | Collection page (sticky toolbar + sidebar) and PDP (gallery + buy box) |
| `phase-3/` | Clerk auth, YMM modal cascade, garage persistence, cart 422 case |
| `phase-4/` | Welcome-back landing, predictive search typeahead |
| `phase-5/` | Streaming RIG chat from Vercel AI Gateway |
| `2026-05-03-handoff/` | Pages added in the second handoff (about, cart, vehicle hub, search, returns, warranty) |

If you need a fresh capture, prefer Playwright MCP (`browser_take_screenshot`)
into `.playwright-mcp/` (gitignored), then promote only the keepers here.
