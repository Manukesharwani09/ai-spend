# Product Metrics Strategy

## The North Star Metric
**Qualified Leads Generated per Week**

*Why:* SignalSpend is not a consumer app; it is a B2B lead-generation asset for Credex. Tracking "Daily Active Users" (DAU) or "Pageviews" is a vanity trap for a tool that a VP of Engineering might realistically only use once a quarter. A "Qualified Lead" is strictly defined as a user who completes an audit, is mathematically flagged by the engine as having >$500/mo in savings, and successfully submits their email for a consultation. This metric directly translates to pipeline velocity and revenue for the sales team.

## 3 Input Metrics that Drive the North Star
To maximize Qualified Leads, we must optimize these three upstream levers:
1. **Audit Completion Rate (Funnel Velocity):** The percentage of landing page visitors who successfully generate a report. This tracks the friction of the input form. If this drops, the form is too tedious.
2. **High-Savings Flag Rate (Audience Quality):** The percentage of completed audits that flag >$500/mo in savings. If this is 1%, we are marketing to the wrong audience (indie hackers with $20 bills). If it's 25%, our GTM targeting is spot on.
3. **Viral Share Coefficient (Acquisition Loop):** The number of unique `/report/rpt_id` URLs generated and subsequently clicked per active user. This tracks the effectiveness of our OpenGraph images and social loops.

## What to Instrument First
Before writing a single line of feature code in Week 2, I would instantly instrument **Form Drop-off Events** using PostHog or Amplitude. 
Specifically, tracking the step-by-step state of the input form. I need to know exactly which tool input (e.g., asking for "API Spend") causes users to abandon the page. If 80% of users drop off when asked for their Anthropic API token volume, we know we need to make that field optional or provide default presets.

## The Pivot Trigger
**If the "Audit Completion" to "Lead Submission" conversion rate falls below 2% after 1,000 visitors.**

*Why:* If thousands of people are taking the audit but no one is leaving their email, it means the tool provides a great "aha!" moment but fails to prove that a Credex consultation is worth their time. It means we are giving away the value for free with zero reciprocity. 

**The Pivot:** If we hit this trigger, we must immediately pivot the architecture to a **gated results model**. We would blur out the final savings numbers and require an email submission to unlock the full report, sacrificing some user goodwill to force the unit economics to work.
