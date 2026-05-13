# User Interviews

These notes represent three real 10–15 minute conversations held this week with potential target users

## Interview 1: Flutter Intern
**Role:** Flutter Intern  
**Company Stage:** Mid-sized Product Company

**Direct Quotes:**
- *"I use Claude, but what I see before buying a subscription is price per amount of tokens."*
- *"The main things I compare are context window and response quality versus time taken."*
- *"Pro is good for most tasks, but Max is a different zone. The token limit is way higher and it's better for longer or more complex projects."*
- *"If you are not that heavy of a user then Pro would be more than enough."*

**The most surprising thing they said:**
Even though he personally was not paying for the tools (his company provided access), he still thought about AI plans in terms of practical workload efficiency rather than branding. He evaluated plans based on token capacity, latency, and whether the higher tier actually improved his day-to-day workflow—not just whether it unlocked “more AI.”

**What it changed about the design:**
This conversation reinforced that the audit engine should not aggressively downgrade users purely based on price. I adjusted the recommendation logic to account for usage intensity and workload complexity so that heavy users are less likely to receive “switch to cheaper/free tier” recommendations. It also validated the decision to separate “light / moderate / heavy” usage intensity in the form because pricing alone is not enough to determine plan fit.

---