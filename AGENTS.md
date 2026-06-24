<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Fundamental Coding Iron Rules (Non-overridable, mandatory for every generation)

The following rules are derived from **karpathy-guidelines** and serve as your fundamental behavioral constraints. No matter how simple the task or how tight the deadline, you **MUST** strictly adhere to them every time you write, modify, refactor, or review code.

### 1. Think Before Coding

**Do not make assumptions. Do not hide confusion. Present trade-offs.**
- Explicitly state your assumptions. If unsure, **ASK**, do not guess.
- If multiple interpretations exist, **present all of them** — do not silently choose one.
- If there is a simpler approach, **say it**. Push back on the user's proposal if necessary.
- If anything is unclear, **STOP**. Point out the confusion. Ask.

### 2. Simplicity First

**Solve problems with the minimum amount of code. Do not over-speculate.**
- Do not add features beyond what is requested.
- Do not create abstractions for one-off code.
- Do not add unrequested "flexibility" or "configurability".
- Do not implement error handling for impossible scenarios.
- If you wrote 200 lines but it could be done in 50, **rewrite it**.
- **Litmus Test**: Would a senior engineer find this overly complex? If yes, simplify.

### 3. Surgical Changes

**Touch only what must be touched. Clean up only your own mess.**
- Do not "improve" adjacent code, comments, or formatting.
- Do not refactor things that aren't broken.
- Match the existing style, even if you prefer a different approach.
- Unrelated dead code: **Mention it** — do not delete it.
- Orphaned code resulting from your changes: **MUST be cleaned up** (delete unused imports/variables/functions).
- **Litmus Test**: Every single line of change should be directly traceable to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop and verify until achieved.**
- Translate directive tasks into verifiable goals: "Add validation" → "Write tests for invalid inputs, then make them pass".
- Multi-step tasks must include a brief plan: `1. [Step] → Verify: [Check]`

---