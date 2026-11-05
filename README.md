# Salesbond CRM — EVOQ integration branch

Salesbond is the primary product source for the EVOQ CRM migration. This development branch preserves Salesbond history and the verified EVOQ R80 integration ancestry. Production `main` and the existing CRM fallback remain unchanged.

**Not production ready.** The security foundation is implemented, but metadata-backed CRM screen compatibility, retired SDK replacements, reports/analytics remotes and full real-tenant acceptance remain incomplete. Do not enable gated features or deploy this branch as a completed migration.

See `docs/r77/IMPLEMENTATION_PROGRESS.md`, `docs/r77/INTEGRATION_PLAN.md`, the API call inventory and source manifests for evidence and remaining work. Configuration keys are documented in `.env.example`; provision actual secrets securely outside Git. Startup refuses missing/invalid security configuration. Authentication belongs to EVOQ; there is no tenant-password fallback.

Development checks:

```sh
npm ci --ignore-scripts --legacy-peer-deps
npm run build:icons
npm run typecheck
npm run test:security
npm run build
```

The fixture browser harness requires an installed matching Playwright/browser cache:

```sh
R77_PLAYWRIGHT_MODULE=/path/to/playwright node tests/r77-browser.cjs
```

It uses a local production build, fixture Central, browser-intercepted user data, and reserved `.test` proxy origins. It is not real Frappe/customer E2E acceptance. The backend security branches have their own `R77_SECURITY_CHANGE.md` and cross-repository test instructions.
