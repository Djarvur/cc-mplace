# Phase 4: Periodic Dependency and Security Checks - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 04-periodic-dependency-and-security-checks
**Areas discussed:** Scanning tool choice, Failure policy, Schedule frequency, Workflow structure

---

## Scanning Tool Choice

| Option | Description | Selected |
|--------|-------------|----------|
| Dependabot | GitHub-native, zero config. Handles security alerts + auto dependency update PRs. No extra workflow needed. | ✓ |
| Renovate | More powerful — auto-grouping, automerge, custom scheduling. Requires bot app installation. Overkill for 4 deps. | |
| npm audit only | Lightweight — add step to CI. Vulnerabilities only, no auto-updates. 0 extra config. | |

**Q2: Security + version updates or security only?**

| Option | Description | Selected |
|--------|-------------|----------|
| Both security + version updates | Dependabot opens PRs for security fixes AND routine version bumps. Fully automated. | ✓ |
| Security updates only | Only alerts for known vulnerabilities. Manual updates otherwise. | |

**Q3: Grouping strategy?**

| Option | Description | Selected |
|--------|-------------|----------|
| Individual PRs | One PR per dependency update. Clear changelogs, easy rollback. | ✓ |
| Grouped minor/patch | Combine updates into single PR. Fewer PRs, harder to debug failures. | |

**Q4: Auto-merge policy?**

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-merge if CI passes | Fastest, appropriate for single-author project with 4 devDeps. | ✓ |
| Manual review required | More control, likely unnecessary overhead. | |

**User's choice:** Dependabot with both security + version updates, individual PRs, auto-merge on CI pass
**Notes:** User consistently chose the recommended options for a small curated project

---

## Failure Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Block on high + medium | Both high and medium block PR. Low/info are warnings. Good balance. | ✓ |
| Block on high only | Only critical/high block. Standard for dev-only deps. | |
| Block on all severities | Very strict, overkill for 4 devDeps. | |

**Q2: Dev vs prod deps?**

| Option | Description | Selected |
|--------|-------------|----------|
| Same policy for all | Scan all deps equally. DevDeps run in CI where supply chain matters. | ✓ |
| Prod deps only | This project has zero prod deps, effectively no scanning. | |

**Q3: Grace period for auto-merge?**

| Option | Description | Selected |
|--------|-------------|----------|
| 5-day grace for version bumps | Wait 5 days on non-critical updates. Security fixes merge immediately. | ✓ |
| Immediate auto-merge | No waiting. Fastest but no review window. | |

**User's choice:** Block on high + medium, same policy for all deps, 5-day grace for version bumps
**Notes:** User chose practical balance — strict enough to catch real issues, grace period for non-critical updates

---

## Schedule Frequency

| Option | Description | Selected |
|--------|-------------|----------|
| Weekly | Checks every Monday. Low noise, reasonable cadence for 4 deps. | ✓ |
| Daily | Faster detection but most days produce nothing. Wastes CI minutes. | |
| Biweekly | Less noise but security fixes arrive later. | |

**Q2: Day of week?**

| Option | Description | Selected |
|--------|-------------|----------|
| Monday | Start of week. Issues get attention during work week. | |
| Friday | End of week. Less common. | |
| Claude's discretion | — | ✓ |

**Q3: Time of day?**

| Option | Description | Selected |
|--------|-------------|----------|
| Business hours | PRs appear when active. | |
| Early morning | PRs ready at start of day, CI off-peak. Standard practice. | ✓ |

**User's choice:** Weekly, early morning, day of week at Claude's discretion
**Notes:** Day delegated to Claude; Monday is standard choice

---

## Workflow Structure

| Option | Description | Selected |
|--------|-------------|----------|
| dependabot.yml only | GitHub's native config. No workflow file needed. Cleanest approach. | ✓ |
| Extend validate.yml | Add npm audit step. Redundant with Dependabot. | |
| Both | Belt and suspenders. Redundant for 4-dep project. | |

**Q2: Ecosystems?**

| Option | Description | Selected |
|--------|-------------|----------|
| npm only | Covers all 4 devDependencies. | |
| npm + GitHub Actions | Also keeps action versions current. Small additional coverage for free. | ✓ |

**Q3: Labels?**

| Option | Description | Selected |
|--------|-------------|----------|
| Standard labels | `dependencies` + `automated` for easy filtering. | ✓ |
| No labels | Dependabot PRs look like any other PR. | |

**User's choice:** dependabot.yml only, npm + GitHub Actions ecosystems, standard labels
**Notes:** Clean config-only approach — no new workflow files

---

## Claude's Discretion

- Day of week for weekly check (user selected "Claude's discretion" → Monday chosen as standard)
- Exact dependabot.yml location, commit message format, open-pull-requests-limit

## Deferred Ideas

None — discussion stayed within phase scope.
