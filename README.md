# OTP Infrastructure Package Family

This repository contains the specification, planning, and implementation work for a modular OTP infrastructure package family for Node.js services. **License:** MIT (see [`LICENSE`](LICENSE)). The workspace root is `private: true`; publishable packages live under `packages/*` (see [ADR-003](docs/decisions/ADR-003-monorepo-publish-model.md)).

## Workspace

The repository is organized as a `pnpm` workspace and is intended to grow into a multi-package monorepo with:

- framework-agnostic OTP core logic
- Redis-backed challenge storage
- SMS and email delivery adapters
- `Express`, `Fastify`, and `Nest` integrations
- a starter composition package for the common Redis + provider happy path
- example applications and cross-package tests

## Commands

```bash
pnpm install
pnpm build
pnpm test
pnpm test:coverage
pnpm lint
pnpm typecheck
pnpm verify:publishability
```

Shared package conventions live in [docs/conventions/package-template.md](docs/conventions/package-template.md).

## Package Roles

- `@otp-service/core`: framework-agnostic OTP lifecycle logic
- `@otp-service/redis-store`: Redis-backed challenge persistence
- `@otp-service/provider-sms-twilio`: Twilio SMS delivery adapter
- `@otp-service/provider-email-resend`: Resend email delivery adapter
- `@otp-service/express`: Express route helpers
- `@otp-service/fastify`: Fastify route helpers
- `@otp-service/nest`: Nest module/controller helpers
- `@otp-service/starter`: thin happy-path composition helpers
- `@otp-service/testkit`: deterministic test doubles and fixtures

## Release Workflow

Versioning and release preparation use [Changesets](https://github.com/changesets/changesets).

```bash
pnpm changeset
pnpm version-packages
```

Public npm publishing is intentionally deferred until internal validation is complete, but the repo is being structured so public release later does not require architectural rework.

`pnpm verify:publishability` checks built package exports, manifest consistency, and consumer-facing type resolution through the generated package entrypoints.

Before tagging or publishing, work through [docs/release-readiness-checklist.md](docs/release-readiness-checklist.md). Architecture decisions worth recording live in [docs/decisions/](docs/decisions/).

Automated releases use [Changesets](https://github.com/changesets/changesets) and [`.github/workflows/release.yml`](.github/workflows/release.yml). Add a GitHub Actions secret **`NPM_TOKEN`** (publish-capable npm token). First-time setup and scope: [docs/publishing.md](docs/publishing.md).

## Quickstart

The intended fast-adoption path is:

1. Compose an `OtpService` with [`@otp-service/starter`](packages/starter/package.json)
2. Attach that service to your framework using a framework package such as [`@otp-service/express`](packages/express/package.json)

```ts
import express from "express";
import {
  createTwilioSmsOtpService
} from "@otp-service/starter";
import {
  createGenerateChallengeHandler,
  createVerifyChallengeHandler
} from "@otp-service/express";

const otpService = createTwilioSmsOtpService({
  redis: {
    client: redisClient,
    keyPrefix: "otp:login"
  },
  signerSecret: process.env.OTP_SECRET ?? "",
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    from: process.env.TWILIO_FROM ?? "",
    httpClient: {
      post: (url, input) => fetch(url, {
        body: input.body,
        headers: input.headers,
        method: "POST"
      })
    }
  }
});

const app = express();
app.use(express.json());
app.post("/otp/generate", createGenerateChallengeHandler({ otpService }));
app.post("/otp/verify", createVerifyChallengeHandler({ otpService }));
```

See the quickstart example in [examples/starter-express-sms/README.md](examples/starter-express-sms/README.md). For a minimal **login-shaped** OTP flow (request → verify → session token), see [examples/dummy-login-flow/README.md](examples/dummy-login-flow/README.md).

## Direct Package Path

If you do not want the starter package, assemble the lower-level path directly:

1. `createRedisChallengeStore(...)` from `@otp-service/redis-store`
2. `createTwilioSmsProvider(...)` or `createResendEmailProvider(...)`
3. `hmacOtpSigner(...)` and `createOtpService(...)` from `@otp-service/core`
4. framework helpers from `@otp-service/express`, `@otp-service/fastify`, or `@otp-service/nest`

This path is better when you need tighter control over provider composition or want to stay closer to the headless core.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) (branching, PR hygiene, Changesets, security).

## Docs

- First commit bootstrap: [initial-import.md](docs/guides/initial-import.md)
- Phase-wise PRs & agent context: [phase-pr-playbook.md](docs/guides/phase-pr-playbook.md)
- Publishing to npm: [publishing.md](docs/publishing.md)
- Release readiness: [release-readiness-checklist.md](docs/release-readiness-checklist.md)
- Starter quickstart: [starter-quickstart.md](docs/guides/starter-quickstart.md)
- Direct package setup: [direct-package-setup.md](docs/guides/direct-package-setup.md)
- Security notes: [security.md](docs/guides/security.md)
- Express adoption: [express.md](docs/guides/frameworks/express.md)
- Fastify adoption: [fastify.md](docs/guides/frameworks/fastify.md)
- Nest adoption: [nest.md](docs/guides/frameworks/nest.md)
- Migrating from a service mindset: [migration-from-service.md](docs/guides/migration-from-service.md)
- Architecture decisions: [docs/decisions/](docs/decisions/)
