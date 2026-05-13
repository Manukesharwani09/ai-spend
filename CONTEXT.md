# Credex SignalSpend - Repository Context

## Overview
This repository contains "SignalSpend", a "Mint for AI tool spend" application designed as a lead-generation asset for startup founders. Users can input their current AI tool subscriptions, team sizes, and usage intensity to receive a comprehensive audit, highlighting potential savings, redundant subscriptions, and recommendations for better alternatives.

## Tech Stack
- **Framework**: Next.js (App Router)
- **UI**: React 19, Tailwind CSS v4, Lucide React (or custom SVG) icons
- **Validation**: Zod (for any parsing logic if present)
- **Database/Lead Capture**: Supabase (via `@supabase/supabase-js`)
- **Email Delivery**: Resend

## Key Directories & Files

### Frontend (`src/app/`)
- `page.tsx`: The main application page. Contains the primary form where users select their tools, input their spend, and generate the audit. Displays the results right on the page without requiring a login.
- `_components/AiSummary.tsx`: A component that dynamically fetches an AI-generated summary of the user's audit results using OpenRouter (GPT-4o-mini).
- `_components/LeadCaptureForm.tsx`: *(New)* Handles lead capture by prompting high-intent users to submit their email and company details after viewing the audit.

### Core Logic (`src/lib/`)
- `audit.ts`: Contains the primary business logic. The `calculateAudit` function processes the user's inputs, compares them against current benchmarks and pricing models, and identifies overlap (e.g., using both Claude and ChatGPT) and savings opportunities.
- `PRICING_DATA.ts`: The raw data source acting as the "source of truth" for the plans, features, and costs of various AI tools (like OpenAI, Anthropic, GitHub Copilot, Cursor).
- `share.ts`: Logic to compress and encode the audit state into a Base64 URL-safe string so reports can be easily shared via links.
- `summary.ts`: Functions to build prompts for the AI summary API, as well as generate rule-based fallback summaries.

### API Routes (`src/app/api/`)
- `summary/route.ts`: Endpoint for generating the AI summary. It calls the OpenRouter API with a prompt built from the user's audit data.
- `lead/route.ts`: *(New)* Endpoint to handle lead form submissions. Implements honeypot spam protection, stores the lead data in a Supabase database, and fires a transactional email via Resend to the user.

## Data Flow
1. User interacts with the form on `page.tsx` (all local state).
2. Clicking "Generate" invokes `calculateAudit()` locally; no backend is hit for the core audit logic.
3. The `<AiSummary />` component hits `/api/summary` to fetch an AI-generated natural language summary of the results.
4. Users can share the report via `shareReport()`, which encodes the local state into the URL for easy sharing.
5. High-intent users can submit their details via the `LeadCaptureForm`, sending data to `/api/lead` for storage (Supabase) and email confirmation (Resend).
