# Reflection

## 1. The hardest bug you hit this week, and how you debugged it

The hardest bug I encountered was a vicious React state and lifecycle issue where the AI-generated audit summary would continuously trigger expensive, redundant API calls to OpenRouter whenever the user interacted with the UI—most notably when they clicked the "Share audit" button. The symptom was jarring: the user would click "Share", the UI would flash to "Generating Summary...", and the copied URL would sometimes encode a `null` summary because the text was still mid-generation.

My initial hypothesis was that my `useEffect` dependency array inside the `AiSummary` component was too broad, or that React Strict Mode was causing double-firing. I tried introducing a `useRef` flag to track if the API had already been called. However, this introduced a new bug where the summary wouldn't update when the user _actually_ changed their inputs and clicked "Generate" again.

My second hypothesis was a referential equality issue. I realized that clicking "Share" updated a `shareMessage` state in the parent `page.tsx`. This caused the parent to re-render, allocating a brand-new `input` object in memory, which bypassed React's shallow equality checks and triggered the `useEffect` inside `AiSummary`. I attempted to fix this by wrapping the `input` object in a `useMemo` hook. However, because the `formState` object tracked live keystrokes, the memoization cache kept breaking anyway.

Finally, I stepped back and realized the root cause was an architectural flaw, not a React optimization issue. The `AiSummary` component should never have been tied to the live, mutable `formState`. It needed to be tied to a frozen snapshot.

To fix it, I introduced a dedicated `submittedInput` state in `page.tsx`. This state is _only_ updated inside the `handleGenerateAudit` execution, acting as a lock. I passed this locked state down to the component. Furthermore, I added an `initialSummary` prop so that when someone views a shared report via a URL snapshot, the component bypasses the API `fetch` entirely and instantly renders the pre-baked summary text. This multi-layered solution stabilized the UI, fixed the sharing flow payload, and entirely eliminated redundant LLM API costs.

## 2. A decision you reversed mid-week, and what made you reverse it

Mid-week, I reversed the decision to encode the entire audit payload (including the AI summary) into a massive Base64 URL for sharing. My initial logic was to keep the app strictly stateless, database-free, and incredibly lightweight for casual users.

However, I reversed this because the Base64 URLs became excessively long, fragile, and looked terrible on social media. More importantly, recalculating old shared reports created inconsistent data if our pricing heuristics changed later. I migrated to a Supabase-backed snapshot system (`/report/rpt_id`), which preserves the exact audit state at the moment of sharing, allowing for clean links and immutable data snapshots.

## 3. What you would build in week 2 if you had it

In week 2, I would build an automated invoice parser. Right now, founders have to manually type in their tools, plans, and spend. This creates friction and relies on their memory or them tabbing back and forth to their billing portals.

I would allow users to drag and drop their AWS, Stripe, or Vendor PDF invoices directly onto the homepage. I'd use an LLM vision API (like Claude 3.5 Sonnet) to extract the exact line items, seat counts, and overages, drastically improving input accuracy, eliminating friction, and increasing the completion rate of the audit funnel.

## 4. How you used AI tools

I used AI extensively for scaffolding UI components and navigating the Next.js App Router API. I tasked an AI with generating the initial Tailwind CSS layouts for the complex pricing tables, which saved me hours of manual CSS writing.

However, I fundamentally didn't trust AI with the core audit math or pricing logic. I hardcoded `PRICING_DATA.md` into deterministic functions. In one specific instance, an AI suggested using ChatGPT to calculate the savings numbers dynamically. I caught this and rejected it immediately, knowing that LLMs hallucinate numbers and cannot reliably perform deterministic financial math, which would ruin the tool's credibility with finance professionals.

## 5. Self-rating

- **Discipline (9/10):** Maintained strict adherence to the MVP spec without getting distracted by unnecessary features.
- **Code Quality (8/10):** Achieved 0 TypeScript errors and structured the audit logic well, though some React components could be further modularized.
- **Design Sense (9/10):** Built a premium, viral "dark mode" aesthetic that genuinely looks like a modern, venture-backed SaaS product.
- **Problem Solving (9/10):** Successfully navigated complex architectural problems, like transitioning to immutable snapshots without breaking legacy URLs.
- **Entrepreneurial Thinking (10/10):** Designed the entire OpenGraph viral loop and Credex lead-capture flow with a clear understanding of acquisition and conversion metrics.
