# R77 — Salesbond CRM integration progress

**Authorization:** R77 development, tests, commits and integration-branch pushes approved. Production deployment, production service/configuration changes, tenant application installation and production database changes remain **HOLD**.

**Status:** development security foundation implemented; full CRM migration and production acceptance **not complete**. Do not deploy this branch. The feature/backend compatibility work below remains a release gate.

## Source preservation and development locations

The original Salesbond checkout at `/home/arundas/Projects/SDL/ERP/salesbond-crm/salesbond-crm-sdldev1` remains unchanged. Development is in an isolated clone of that exact history under this workspace:

| Component | Development directory | Branch / starting point |
|---|---|---|
| Primary Salesbond frontend | `integration/r77/salesbond-crm` | `integration/r77-salesbond-evoq`, from Salesbond `3b756d726a374c656c16eec08c917e5f6211fcea` |
| Central package layer | `integration/r77/evoq_saas_package_layer` | `integration/r77-central-security`, from current official main `1281107a7da4742bcf9e8cf7a682c5040632aa37` |
| Tenant authentication | `integration/r77/evoq_tenant_auth` | `integration/r77-jwt-security`, from `15196d4b8f8159a8e6b5aeee013635ba50b6eb61` |
| Salesbond metadata backend | `integration/r77/sdl_metadata` | `integration/r77-dashboard-security`, from `b0a056ecfc8beb99fa10e8bc0101b48e75a7d34d` |

The workspace root is `/home/arundas/Projects/SDL/ERP/EVOQCLOUD/evoqcloudcentral/evoqcentral`. Original backend working directories contain existing local changes and were not edited. The production fallback `crm-frontend-embed` remains at `ad2dac917d1bc3f6ae7d4e3e623ecd0c802c7284`.

Salesbond and EVOQ frontend Git histories were compared and have no merge base. Salesbond's entire ancestry is retained. The integration branch records EVOQ R80 ancestry without replacing the Salesbond product tree; production `main` is never rewritten. Both frontend remote main references were independently read as `ad2dac917d1bc3f6ae7d4e3e623ecd0c802c7284` before pushing.

Source manifests are in the frontend branch at `docs/r77/salesbond-source-manifest.json`, `evoq-reference-manifest.json` and `source-provenance.json`. The preceding read-only production audit established parity of 1,003 `src/tests/public` files with the R80 reference. Git metadata alone is insufficient: production Central reported an initialization commit while selected live source files matched later reviewed source. The security work was moved onto current official main `1281107` before committing, keeping the unrelated R75 payment-first feature commit out of this branch; broader production-file reconciliation remains required before backend release.

The user confirmed `https://github.com/evoq-tech/sdl_metadata` as the metadata backend destination after its earlier access failure. Repository/mirror verification is tracked below.

## Implemented frontend security foundation

- Host-only signed HttpOnly session cookies; production Secure/Lax attributes; strict user/org/app/time/payload checks; no development signing-secret fallback.
- Startup configuration validation for session/service secrets, Central transport, public origin, RSA public key and explicit tenant-host allowlist.
- Central ticket redemption, organization launch authorization, direct-entry redirects, explicit safe callback paths, standalone and CTRL frame entry behavior.
- A shared protected handler on every protected Next API route. Session and rendered-page organization are mandatory; client authentication/delegation/service headers are refused.
- Exact-origin plus session-bound CSRF tokens for mutations, including logout and organization switching. GET logout is read-only; automatic session-ended cleanup first verifies revocation.
- Central resolver responses bound to expected user, organization, application and opaque user key. Each request revalidates authorization with Central; no stale resolver authorization cache.
- Server-side RS256 signature/issuer/audience/application/org/scope/subject/time validation before delegation is used. No delegation JWT is returned to the browser.
- Wildcard image-optimizer remote access removed; remote image origins are unavailable pending an audited image transport.
- HTTPS-only exact tenant-host allowlist, canonical origin/path checks, public DNS-answer validation and DNS-pinned TLS transport. Redirects are refused rather than forwarded with credentials. IPv6 is deliberately unavailable pending a verified IPv6 egress policy.
- Request/response limits, upstream timeout, route/method/DocType policies, server-owned-field protections and non-cacheable protected responses. A per-process abuse limiter is present; a distributed limiter is still required for production.
- Retired credential login/OTP/token issuance and browser credential persistence disabled. New session facts and anti-CSRF tokens are non-authentication data; no fake browser access token is introduced to satisfy old UI assumptions.
- New organization-prefixed module URLs rewrite into the existing Salesbond routes, preserving its components. Session organization and page organization must match.
- Existing CTRL origin/source-checked message bridge and page-organization binding adapted into the latest root/layout. Standalone and frame behavior still require full visual/interaction acceptance.
- Secured user/profile/fixed-role screens are wired to the new BFF in Salesbond's layout. Existing Salesbond user/role components remain in source; arbitrary tenant-user/password/role-editor operations are not enabled.
- Same-origin client API configuration, external protected reports rewrite removed, CSP framing restricted to self/CTRL, same-origin connection policy and safe headers.
- Private attachment upload defaults, supported MIME/size limits and approved parent DocTypes. Private-file download and the complete attachment UX still require integration verification.

Main frontend change areas: `src/lib/{session,security,startup,central,tenant-resolver,delegation,backend-policy,operation-policy,tenant-fetch,frappe-list,frappe-doc,user-management,embed,embed-client,global-logout,logout-response,logout-page,one,ctrl,navigation}.ts`; `src/instrumentation.ts`; protected `src/app/api/**`; org routes/root layout/middleware; `EvoqBoundary`/`EmbedBridge` and user-management components; auth services/token storage; configuration and build/test scripts. The final commit diff is authoritative for the exact file list.

## Backend vulnerabilities fixed in development

| Finding | Development fix | Verification / limitation |
|---|---|---|
| Non-atomic launch-ticket fallback | Explicit transactional Redis GET+DELETE; store failure returns 503 without a read/delete fallback | Unit failure test, concurrent consumption test and real disposable Redis transaction/expiry test |
| Guest redemption without service authentication | Redemption requires the existing Central service credential boundary | Code change; development-mode missing-secret bypass also removed. Full Frappe endpoint/service-auth integration remains required |
| Active entitlement with stale billing suspension | Resolver also checks subscription standing for Active entitlements | Code change; lifecycle/contract fixtures and real Frappe billing integration remain required |
| Central tenant URL regex permitted unsafe destinations | Canonical HTTPS EVOQ tenant origin and org matching | Development policy code; complete Central suite and deployment mapping inventory remain required |
| Incomplete delegation JWT claims | Tenant verifies issuer, canonical audience, app, mandatory org pin and bounded lifetime; Central verifier also enforces issuer/context and requires expected audience | Real RSA-key negative tests cover tenant verifier; Central utility integration suite remains required |
| Dashboard guest write / ignored permissions | Guest access removed; require authenticated delegated tenant context and Sales Manager; enforce native create/write/read permissions; payload org/type/size checks; save without bypass; audit comment | Negative and authorized-save unit tests; real Insights/Frappe document/share/field tests remain required |
| Caller role/username hints influenced dashboard reads | List uses the actual authorized caller and native permitted list/read operations; retired alternate authorization helpers removed | Unit read/role-hint tests; share-model integration remains required |
| Generated artifacts in metadata source | 53 previously tracked `.pyc` files removed from integration index; bytecode ignored | Source files and original history preserved; no generated bytecode included in new branch tree |

The latest local metadata working changes were carried forward in a separate development commit: status lookups order by `position` where available, and the CRM Lead customization JSON trailing comma is corrected. All 24 metadata JSON documents parse; lookup Python compiles and the 19-test backend suite passes. The original local files remain unchanged. This preserves those changes without claiming the unaudited generic lookup endpoint is safe to enable.

No production backend code/configuration was edited or installed.

## API compatibility inventory

`docs/r77/api-call-inventory.json` records **1,470 original source call sites/configuration references**, with original file and line. These are not 1,470 distinct endpoints. Automated classification provides a review queue, not a completed semantic contract audit:

| Classification | Entries | Status |
|---|---:|---|
| Dynamic calls requiring full classification | 733 | Incomplete |
| Retired SDK references requiring scoped replacement | 460 | Request surface denied; replacement incomplete |
| API base references | 107 | Same-origin base configured; dynamic endpoints still need verification |
| Standard Frappe calls | 75 | Narrow BFF policy; each operation requires real contract tests |
| Same-origin BFF calls | 52 | Guarded; functional fixture/backend acceptance incomplete |
| Metadata/report/Insights references | 43 | Backend capability gate closed pending complete security/contract review |

Existing permission-aware Frappe list/count/document/related/comment/note/file adapters were selectively adapted from EVOQ. Filters are not silently removed to repair schema mismatches. Browser-supplied roles, usernames, SQL joins and old SDK dispatch must never become authorization inputs.

The dashboard add/remove-widget handlers previously used a shared process-wide in-memory map. Those handlers now return an explicit unavailable response; they have not been presented as a tenant-safe persistence implementation.

## Feature parity and disabled capabilities

| Feature | Current development status | Remaining acceptance |
|---|---|---|
| Central SSO / BFF / session / isolation | Foundation implemented | Real Central/tenant multi-user and multi-process tests, deployment configuration/pins, operational gates |
| Secured user/profile/fixed roles | Routed to secured BFF screens within Salesbond layouts | Real tenant permissions and complete latest user/settings UI adaptation |
| Leads, Deals, Contacts, Accounts, Tasks | Latest components retained; standard protected BFF adapters present | Metadata-driven screen initialization still contains browser-token assumptions and missing backend contracts; complete UI CRUD/filter/relationship E2E is **not passed** |
| Dashboard home | Latest component retained; clear backend-unavailable state | Audited metadata/Insights persistence and matching role/share/field contracts |
| Custom dashboards / widget mutations | Explicit backend capability unavailable | Replace shared process store; complete native permission and tenant-bound persistence tests |
| Metadata forms/layout builder/custom fields / conversion | Source preserved; unaudited APIs denied | Audit remaining metadata methods/models/migrations; implement scoped replacements; remove token-presence assumptions; transaction/idempotency and permissions tests |
| Reports / analytics / federation | Source preserved; remote execution/routes disabled | Adapt remote repositories to token-free same-origin API contracts; review/pin remote artifacts and datasets |
| Settings / permission matrix / territories | Latest source preserved; advanced routes gated | Secure capability/role model and missing scoped contracts; no SDK or System Manager workaround |
| Product/stock/ERPNext/store routes | Explicitly unavailable | Prove enabled product scope/dependencies; do not presume ERPNext installed on CRM tenants |
| Activities / calendar / notifications | Source retained where present; complete contract inventory pending | Verify actual implementations, backend dependencies and browser workflows; not claimed accepted |
| CTRL embedding / theme / mobile | Bridge and org binding adapted | Fixture browser checks plus full R80 theme/viewport/form/standalone regression and real SSO acceptance |

**There is no full feature-parity claim.** Some core Salesbond screen initialization still depends on the metadata layer and old token checks. Those must be replaced with real session/capability state, not a JavaScript-visible credential or synthetic access token. Disabled features must remain clearly unavailable; hiding or gating them is not completed migration acceptance.

## Test evidence

| Gate | Result | Scope |
|---|---|---|
| Original Salesbond TypeScript check | Passed | Original unmodified source; no emit/incremental writes |
| Integrated Salesbond TypeScript check | Passed before final build | Latest final production build repeats type validation |
| Existing EVOQ reference suite | **150/150 passed**, 37 suites | Unchanged reference baseline, not integrated Salesbond parity |
| New Salesbond security suite | **16/16 passed** | Sessions, CSRF, org isolation, SSRF/path policy, real RS256 claims, protected routes, mass assignment, filter preservation, mocked-transport authenticated route delegation |
| Backend security suite | **19/19 passed** (auth/metadata), **20/20 passed** (Central follow-up) | Real cryptographic signatures and mocked Frappe permission boundaries; no database-backed bench |
| Real Redis concurrency/expiry | **1/1 passed** | Disposable local Redis, 100 concurrent redemption attempts; exactly one success; expiry refused |
| Production build | **Passed** | Compiled, lint/type validation and static generation; build `yUfw3aZN2BCT7HWwc4WH`, startup hook, relative org routes and repaired lockfile included |
| Chromium/Firefox browser harness | **21/21 passed** | Local build with reserved `.test` origins and proxy redirect/CSP adaptation; fixture Central and browser-intercepted user data; no customer credentials or live Frappe |
| Real Frappe/Insights API, role/share and schema integration | **Not run** | Required before feature activation/release |
| Full Salesbond CRM CRUD/visual/mobile/embedded E2E | **Not passed** | Required before production approval |
| Dependency advisory audit | **FAILED release gate: 114 findings — 4 critical, 38 high, 64 moderate, 8 low** | npm registry audit of candidate lockfile; severity is advisory classification, not proof of exploitation |
| Metadata source validity | **24/24 JSON documents parsed** | Includes the original local CRM Lead JSON fix; not a Frappe migration test |
| Distributed revocation/load/limiting | **Not run** | Production gate |

The local browser harness is `tests/r77-browser.cjs`. It must be run with a matching Playwright installation/browser cache. Its fixture boundary must be retained in any report; a fixture success is not a customer-tenant acceptance result.

Reproduction from the workspace root:

```sh
cd integration/r77/salesbond-crm
npm run typecheck
npm run test:security
npm run build
# Set R77_PLAYWRIGHT_MODULE to an installed, matching playwright module.
node tests/r77-browser.cjs
```

For backend test fixtures (from the workspace root, with Python PyJWT/cryptography and Redis available):

```sh
R77_INTEGRATION_ROOT="$PWD/integration/r77" python3 integration/r77/evoq_tenant_auth/tests/test_r77_cross_repository_security.py
R77_INTEGRATION_ROOT="$PWD/integration/r77" python3 integration/r77/evoq_saas_package_layer/tests/test_r77_redis_atomicity.py
```

Tests start no production process and write no production database. New configuration templates contain empty secret fields, not reusable development credentials. The frontend lockfile now includes the exact inherited Next optional SWC package versions with registry integrity metadata; dependencies were not upgraded by this repair.

## Git synchronization

Backend commits: tenant auth `8e2a84c`; Central `aabc058` plus `f86dcaa`; metadata security `45d21b8` plus local-source preservation `4bc7260`. Frontend implementation commit: `2f662fd`; ancestry-preserving merge: `ed4ad3a22ced3f92fb2969d4a736dc95a37dbfeb`. The merge has the identical tree hash `6d5e86817e8f8df8da1477af14528886f380ba29` and both Salesbond and EVOQ R80 heads are verified ancestors. Final branch heads and mirror equality are recorded after the documentation commit.

The metadata checkout initially had a shallow boundary with a missing parent object, so its first push was rejected. Its full ancestry was recovered from the original Salesbond checkout's complete `origin/backend_sdl_metadata` history; `git fsck --connectivity-only` now passes and the integration clone is no longer shallow. No history was rewritten. The original recorded GitLab URL required credentials, but the existing complete local source provided the required ancestry. Tenant auth and Central branches are pushed to both `evoq-tech` and `arundassdl`; the metadata branch is pushed to the confirmed `evoq-tech/sdl_metadata`. The user reconfirmed `evoq-tech/sdl_metadata` as the metadata destination; no separate metadata mirror was specified. That component is published to the confirmed target only. No force-push or production-main update is authorized or planned.

Source-manifest recheck after implementation found zero changes in the original Salesbond and EVOQ reference `src/tests/public` files. No new/changed generated artifacts or high-confidence server-secret patterns were found in the frontend commit inputs. Existing public Firebase client configuration remains a separate production domain/API-restriction verification item; it is not treated as a server secret. Missing mirror access is a synchronization blocker, not permission to push a backend tree into a frontend repository.

## Dependency audit — additional P0 blocker

The time-bounded `npm audit --package-lock-only --ignore-scripts --json --fetch-timeout=20000 --fetch-retries=0` request completed with a failing audit gate: **114 findings, including 4 critical and 38 high**. Critical package entries include `next`, `swiper`, `tar`, and `websocket-driver`. The audit also flags direct dependencies such as Axios, Sharp, PostCSS and development tooling. These are findings against the candidate dependency graph, not a production compromise claim or a completed exploitability assessment.

Evidence is retained at `docs/r77/dependency-audit.json`. Do not use `npm audit fix --force` to replace major versions blindly: Next/React/App Router, federation, Swiper and image-processing compatibility must be upgraded and retested deliberately. No package upgrade is claimed in this checkpoint; the prior SWC lockfile repair only made the inherited versions reproducible. The CI workflow now fails closed at the critical dependency audit step. Local build/type/unit successes do not mean that overall release CI is green.

Resolve runtime-critical dependencies first, then transitive and development-tool findings, and rerun this audit, real API contracts and browser/feature parity tests. This is additional P0 development work under R77, not a request for production approval.

## Remaining blockers and production readiness

0. Remediate the dependency audit, including all four critical package findings, with a deliberate compatible upgrade and regression strategy.
1. Complete semantic endpoint classification and scoped replacement of retired SDK calls.
2. Audit and secure all required metadata/report/Insights APIs, permission models, datasets and migrations. The dashboard fix alone does not certify these applications.
3. Replace remaining browser-token presence checks with verified session/capability state; complete core module initialization and CRUD/data-contract parity.
4. Adapt and pin analytics/reports remotes without token props or privileged external API rewrites.
5. Complete private downloads, file-parent permissions and remaining activities/calendar/notification workflows.
6. Add a distributed rate limiter, redacted security-event audit/retention and operational monitoring; confirm all DNS/IPv6/custom-domain policies and supported tenant mappings.
7. Validate issuer/key/site/org configuration, rotation and additive compatibility on disposable real Frappe tenants. Newly strict verifiers require readiness checks before any later rollout.
8. Run real multi-user/multi-org functional/security tests and complete Salesbond UI, R80 theme/viewport/iframe and customer-journey acceptance.
9. Reconcile actual server-source/configuration drift for every backend release; lock Git provenance to file manifests and deployable artifacts.
10. Rehearse zero-disruption deployment and rollback, then seek a separate production approval only after acceptance. Do not request production deployment while these blockers remain.

## Deployment and rollback preparation

Retain public CRM/CTRL/One URLs and the old CRM artifact. Prepare an immutable Salesbond candidate from the integration branch, on a separate local listener, with explicit configuration/pins and startup preflight. Keep backend/schema changes additive and independently releasable. Use disposable staging A/B tenants and fixed test roles before a pilot cohort.

Before any future production action: refresh manifests/backups, verify old/new session and backend compatibility, establish measured error/latency thresholds and rehearse a traffic switch/rollback without dropping customer writes. Preserve the current CRM/Nginx/env artifact. Do not deploy by copying the integration tree over `/var/evoq-frontends/crm`; do not roll back security fixes or restore customer databases to reverse a frontend change.

**Production readiness: NO. Production deployment: HOLD.**
