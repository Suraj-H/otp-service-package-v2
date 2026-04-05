# Fastify Adoption

Use `@otp-service/fastify` when your service owns Fastify routes and wants OTP-specific route handlers plus a framework-native error handler.

## What It Provides

- `createGenerateChallengeHandler(...)`
- `createVerifyChallengeHandler(...)`
- `fastifyOtpErrorHandler(...)`
- `FastifyOtpValidationError`

## HTTP Semantics

Verify responses map to:

- `VERIFIED` -> `200`
- `INVALID` -> `400`
- `EXPIRED` -> `410`
- `ATTEMPTS_EXCEEDED` -> `429`
- validation errors -> `422`

## Example

```ts
app.setErrorHandler(fastifyOtpErrorHandler);
app.post("/otp/generate", createGenerateChallengeHandler({ otpService }));
app.post("/otp/verify", createVerifyChallengeHandler({ otpService }));
```

## Reference

- example app: [examples/fastify-email](../../../examples/fastify-email/README.md)
