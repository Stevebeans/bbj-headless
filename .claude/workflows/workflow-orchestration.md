# Workflow Orchestration

## 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
- **On plan approval:** IMMEDIATELY write context files before coding (see #7)

## 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

## 3. Self-Improvement Loop

- After ANY correction from the user: update `.claude/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

## 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

## 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

## 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## 7. History & Context Files

**IMMEDIATELY after the user approves a plan (before writing any code):**

1. **Create/update daily history** at `.claude/history/YYYY-MM-DD.md`
   - Write the plan summary, what you're about to build, key decisions made
   - **Link to the project context file** (e.g., `See: [context-user-profiles](../projects/context-user-profiles.md)`)
   - This is your crash recovery - if the session dies mid-implementation, the next session can pick up from here

2. **Create project context file** at `.claude/projects/context-[projectname].md` (for any plan mode project)
   - Architecture overview, files to create/modify, key patterns, dependencies
   - This is the detailed reference that persists after the project is done

**During implementation:** Update the daily history as major milestones complete

**At end of session:** Final update to daily history with what was completed, what's left, and any decisions made during conversation

**Session startup read order:** `CLAUDE.md` → `workflow-orchestration.md` → last 2 days of `.claude/history/` → any linked `context-[project].md` files

The history should be an easy callback so if you crash, or I exit the session, you can quickly remember what you were working on.

---

# Task Management

1. **Plan First**: Write plan to `.claude/tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `.claude/tasks/todo.md`
6. **Update Roadmap**: When task is complete and working, update `.claude/projects/roadmap.md`
7. **Capture Lessons**: Update `.claude/lessons.md` after corrections

---

# Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
