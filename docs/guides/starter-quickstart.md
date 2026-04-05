# Starter Quickstart

This is the fastest adoption path for a Node.js service that wants Redis-backed OTP state plus one real provider.

## When To Use It

Use `@otp-service/starter` when you want:

- the common Redis + provider composition path
- explicit security inputs without manually wiring every package
- a short path from install to working routes

Do not use it if you need a custom store, a custom signer abstraction, or more control over how the core service is assembled.

## Install Shape

Typical runtime shape:

```ts
import {
  createTwilioSmsOtpService
} from "@otp-service/starter";
import {
  createGenerateChallengeHandler,
  createVerifyChallengeHandler
} from "@otp-service/express";
```

You bring:

- a Redis client compatible with `@otp-service/redis-store`
- a provider HTTP client
- an OTP signer secret from your own secret-management path

## Express Example

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

## Defaults

Starter policy defaults:

- OTP length: `6`
- TTL: `600` seconds
- max verify attempts: `3`

Override them only when you have a concrete product or security reason.

## Verification

Quickstart coverage is exercised by:

```bash
pnpm exec vitest run tests/integration/starter-express.test.ts
```

The runnable example is documented in [examples/starter-express-sms](../../examples/starter-express-sms/README.md).
