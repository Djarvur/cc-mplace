# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-24
**Phases:** 4 | **Plans:** 6 | **Sessions:** 3

### What Was Built
- Valid marketplace.json with AJV schema validation and uniqueness enforcement
- cc-websearch as first installable plugin via `claude plugin install cc-websearch`
- README with CLI usage docs and plugin table
- GitHub Actions CI: Prettier, Vitest, Claude Code validate, source verification
- Dependabot + auto-merge + branch protection for ongoing maintenance

### What Worked
- TDD for Phase 1 (RED → GREEN) caught schema issues early
- Static registry architecture kept complexity minimal — zero infrastructure
- Sequential phase execution with CI established in Phase 3 before Dependabot in Phase 4
- RESEARCH.md caught D-04/D-09 conflict before implementation (auto-merge needs a workflow)

### What Was Inefficient
- Phase 3 CI verification (Plan 03-02) required iterative fixes for Prettier ignore scope and cross-repo API auth — could have been caught in research
- Plan checker flagged D-09 as a blocker even though the research already identified the resolution — one revision loop consumed tokens for a known resolution

### Patterns Established
- PR-based publishing flow with four-step CI validation
- Dependabot config + auto-merge workflow as the standard dependency maintenance pattern
- Branch protection on main with required status checks before merge

### Key Lessons
1. Research before planning catches architectural conflicts (D-04/D-09) that would be expensive to fix during execution
2. Static registry with raw GitHub URL hosting eliminates entire categories of infrastructure complexity
3. Dependabot auto-merge requires three repo-level prerequisites (allow_auto_merge, branch protection, label creation) — plan them as explicit tasks

### Cost Observations
- Model mix: ~70% opus, ~30% sonnet
- Sessions: 3 (init, phases 1-3, phase 4)
- Notable: Entire MVP (4 phases, 8 tasks) shipped in 2 days with ~15 min total execution time

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 3 | 4 | Initial MVP — established static registry architecture and CI pipeline |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 5 Vitest | Schema + uniqueness | 2 (dependabot.yml, auto-merge workflow) |

### Top Lessons (Verified Across Milestones)

1. Static-first architecture eliminates infrastructure complexity and enables zero-cost hosting
2. Research phase catches design conflicts before they become execution blockers
