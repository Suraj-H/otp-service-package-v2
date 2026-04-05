# Dummy login flow (workspace example)

Minimal **email OTP → verify → session token** flow using `@otp-service/core`, `@otp-service/express`, and `@otp-service/testkit` with an in-memory store and recorded “send” (no real email).

## Run

From the **monorepo root**:

```bash
pnpm install
pnpm build
cd examples/dummy-login-flow
pnpm dev
```

Default port: **3010** (`PORT` overrides).

## HTTP flow

1. **Request OTP** — `channel` is fixed to `email`, `purpose` to `LOGIN`.

   ```bash
   curl -sS -X POST http://127.0.0.1:3010/auth/login/request-otp \
     -H 'Content-Type: application/json' \
     -d '{"email":"ada@example.com"}'
   ```

2. **Dev: read the OTP** (would be an email/SMS in production):

   ```bash
   curl -sS http://127.0.0.1:3010/auth/dev/last-otp
   ```

3. **Verify and obtain session** — body uses `code` (maps to the library’s `otp`).

   ```bash
   curl -sS -X POST http://127.0.0.1:3010/auth/login/verify \
     -H 'Content-Type: application/json' \
     -d '{"challengeId":"<id-from-step-1>","code":"<otp-from-step-2>"}'
   ```

4. **Authenticated request**:

   ```bash
   curl -sS http://127.0.0.1:3010/auth/me \
     -H "Authorization: Bearer <sessionToken>"
   ```

## Raw OTP routes

The generic handlers are also mounted for comparison:

- `POST /otp/generate` — body: `{ "channel", "purpose", "recipient" }`
- `POST /otp/verify` — body: `{ "challengeId", "otp" }`

## Security

`GET /auth/dev/last-otp` is for local testing only; remove or guard it in any real deployment.
