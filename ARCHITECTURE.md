# SignalSpend Architecture

## System Diagram

```mermaid
flowchart TD
    subgraph Client [Browser]
        UI[React UI Component]
        FormState[(LocalStorage)]
        AuditEngine[Local Audit Engine]
        UI <--> FormState
        UI -->|Generate Audit| AuditEngine
    end

    subgraph Serverless [Next.js App Router]
        SummaryAPI[/api/summary]
        ShareAPI[/api/share]
        LeadAPI[/api/lead]
        OGImage[/report/:id/opengraph-image]
        ReportViewer[Report Server Component]
    end

    subgraph External [External Services]
        OpenRouter[OpenRouter / OpenAI]
        Supabase[(Supabase DB)]
        Resend[Resend Email]
    end

    AuditEngine -.->|Request AI Summary| SummaryAPI
    SummaryAPI -->|Prompt| OpenRouter
    
    UI -.->|Share Audit| ShareAPI
    ShareAPI -->|Save Immutable Snapshot| Supabase
    
    UI -.->|Submit Email| LeadAPI
    LeadAPI -->|Insert Lead Row| Supabase
    LeadAPI -->|Trigger Transactional| Resend

    ReportViewer -->|Fetch Snapshot by ID| Supabase
    OGImage -->|Fetch Snapshot by ID| Supabase
```

## Data Flow: How Input Becomes an Audit Result

1. **Input Phase:** The user selects their AI tools, plans, seats, and use case. This state is strictly managed in React and persisted in the browser's `localStorage`. No data leaves the device yet.
2. **Execution Phase:** When the user clicks "Generate", the `calculateAudit()` function runs locally. It compares their current stack against hardcoded pricing data (`PRICING_DATA.md`) to determine fit, find cheaper comparable plans, and detect overlapping workflows.
3. **AI Augmentation:** Concurrently, an asynchronous request is made to `/api/summary` containing the raw JSON output of the audit engine. The API constructs a prompt and fetches a personalized 100-word summary from an LLM. If the LLM fails or times out, the UI falls back to a deterministic string.
4. **Rendering:** The UI instantly paints the math-based recommendations and streams in the AI summary once it resolves.
5. **Persistence (Opt-in):** 
   - If the user enters their email, the entire audit JSON is bundled with their contact info and sent to `/api/lead` for storage in Supabase.
   - If the user shares the report, the audit JSON is sent to `/api/share`, which saves an immutable snapshot to Supabase and returns a short ID (`rpt_1a2b3c`) for viral sharing.

## Why Chose This Stack

- **Next.js (App Router):** Provides a unified environment for both the heavily interactive client-side form and the secure server-side API routes (hiding API keys for Supabase, Resend, and OpenRouter).
- **Supabase:** Offers extremely fast, lightweight JSONB storage for our leads and public snapshots without the overhead of managing a traditional Postgres instance. The free tier is generous enough for a Product Hunt launch.
- **Resend:** Purpose-built for developers with a fantastic Node SDK. It ensures high deliverability for our transactional confirmation emails.
- **OpenRouter:** Prevents vendor lock-in. If Anthropic goes down or rate-limits us during launch, we can hot-swap to OpenAI's models simply by changing the model string, without rewriting SDK implementation code.
- **Tailwind CSS:** Allowed for rapid, pixel-perfect prototyping of the complex, data-heavy pricing tables and cards without writing fragile custom CSS classes.

## Scaling to 10k Audits/Day

If the application were to scale to 10,000 audits a day, the architecture would largely hold up because the core audit engine is entirely client-side (offloading compute to the user's browser). However, the following adjustments would be necessary:

1. **AI Summary Caching:** 
   10k audits/day means 10k LLM calls, which is slow and expensive. Since many users have identical "starter stacks" (e.g., 1 Copilot seat + 1 ChatGPT Plus seat), we would hash the input state and cache the AI summary response in **Redis (Upstash)**. If a hash matches, we return the cached summary instantly, saving API costs and reducing latency to zero.
2. **Rate Limiting Migration:**
   The current basic rate limiter in `/api/lead` uses a local memory map, which resets when serverless functions cold-start. At 10k/day, we would migrate rate-limiting to **Upstash Redis** to ensure global, accurate abuse protection across all Vercel edge nodes.
3. **Asynchronous Email Queuing:**
   Instead of `await resend.emails.send()` inside the API route (which ties up the serverless function execution time and could time out), we would push lead capture events to a background queue (like Inngest or Upstash QStash) to handle the database write and email sending asynchronously.
