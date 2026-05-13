# Automated Tests

**Filename**: `src/lib/__tests__/audit.test.ts`

**What it covers**: The core audit engine logic. It ensures the math, downgrades, alternative generation, and overlap rules evaluate correctly under 30 different permutation scenarios.

**How to run it**: 
```bash
npm run test
```

## Minimum Required Tests (Audit Engine)
These 5 tests explicitly cover the core audit engine constraints.

1. **Solo founder business plan downgrade**
   - Covers: Ensures a 1-person team using a Business plan is correctly downgraded to a Pro plan.
2. **Duplicate coding assistant overlap**
   - Covers: Detects when a team is paying for both Cursor and GitHub Copilot, triggering an overlap warning.
3. **High API spend triggers Credex**
   - Covers: Validates that >$500 in direct API spend triggers the `credexRecommended` flag for lead generation.
4. **Billing mismatch detection**
   - Covers: Identifies if reported spend is materially higher than standard list pricing for the configuration.
5. **Seat count vs team size waste**
   - Covers: Triggers a priority warning if a user inputs more paid seats than their total team size.
