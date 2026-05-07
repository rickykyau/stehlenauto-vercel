import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { auth } from "@clerk/nextjs/server";
import { getCurrentVehicle } from "@/lib/garage/server";
import { getProduct } from "@/lib/catalog";

// AI Gateway routes "provider/model" strings; on Vercel the OIDC token auths
// transparently. AI_GATEWAY_API_KEY only needed for non-Vercel hosts.
const MODEL = process.env.AI_GATEWAY_MODEL || "anthropic/claude-sonnet-4-6";
const MAX_TURNS = 16;

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are RIG, the install assistant for Stehlen Auto — a heavy-duty truck/SUV/Jeep accessories storefront.

Brand voice:
- Lowercase tags ("morning."), short sentences, mechanic's tone. No emoji. No marketing fluff.
- Honest about install difficulty, fitment uncertainty, and timing.
- "Vehicle" not "truck" in copy (Stehlen also sells SUV / Jeep parts).

What you can help with:
- Fitment questions ("will this fit my 2020 F-150?")
- Install steps + torque specs (refer to /help/install for PDFs)
- Order status (point to /account, never make up tracking numbers)
- Returns (/returns/[orderId] flow, 30-day window, prepaid label)
- Warranty (lifetime structural, /legal/warranty)

Hard rules:
- NEVER invent product SKUs, prices, fitment data, or tracking numbers
- If you don't know, say so and suggest "talk to a human" → 1-888-378-4536 Mon–Fri 9–5 PST
- For complex install help mid-job, escalate to a real tech
- Don't recommend competitor products
`;

type PageContext = {
  pathname?: string;
  productHandle?: string;
  collectionHandle?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: UIMessage[];
    pageContext?: PageContext;
  };
  const messages = body.messages;
  const pageContext = body.pageContext;

  const { userId } = await auth();
  const vehicle = await getCurrentVehicle().catch(() => null);

  const contextLines: string[] = [];
  if (vehicle) {
    contextLines.push(
      `User's saved vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}.`,
    );
  }
  if (userId) contextLines.push(`User is signed in (Clerk ID ${userId}).`);

  // Cycle 14AA (Mike-O14AA F-3 MAJOR): when the user is on a PDP, hand the
  // product context to RIG so "will this fit my truck?" gets a direct
  // answer instead of "what part are you looking at?"
  if (pageContext?.productHandle) {
    try {
      const product = await getProduct(pageContext.productHandle);
      if (product) {
        const lines = [
          `User is currently viewing this product:`,
          `- Title: ${product.title}`,
          `- Handle: ${product.handle}`,
          `- SKU: ${product.sku ?? "n/a"}`,
        ];
        if (product.fitTitle) lines.push(`- Fitment text: ${product.fitTitle}`);
        if (product.vehicleTags && product.vehicleTags.length > 0) {
          lines.push(`- Vehicle tags: ${product.vehicleTags.slice(0, 12).join(", ")}`);
        }
        contextLines.push(lines.join("\n"));
        contextLines.push(
          `When the user asks "will this fit?", use the saved vehicle and the product fitment text above to give a direct answer. Do NOT ask which product they're looking at — they're on the PDP for the product above.`,
        );
      }
    } catch {
      // Storefront API down — fall back to no product context.
    }
  } else if (pageContext?.collectionHandle) {
    contextLines.push(
      `User is browsing the collection: /collections/${pageContext.collectionHandle}.`,
    );
  } else if (pageContext?.pathname) {
    contextLines.push(`User is currently on: ${pageContext.pathname}.`);
  }

  const system =
    SYSTEM_PROMPT +
    (contextLines.length ? `\n\nSession context:\n${contextLines.join("\n")}` : "");

  // Trim long histories so cold turns stay snappy.
  const trimmed = messages.slice(-MAX_TURNS);
  const modelMessages = await convertToModelMessages(trimmed);

  const result = streamText({
    model: MODEL,
    system,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
