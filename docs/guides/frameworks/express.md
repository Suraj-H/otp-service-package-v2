# Express Adoption

Use `@otp-service/express` when your service already owns its Express routes and only needs OTP-specific request mapping plus response semantics.

## What It Provides

- `createGenerateChallengeHandler(...)`
- `createVerifyChallengeHandler(...)`
- `ExpressOtpValidationError`

## HTTP Semantics

Verify responses map to:

- `VERIFIED` -> `200`
- `INVALID` -> `400`
- `EXPIRED` -> `410`
- `ATTEMPTS_EXCEEDED` -> `429`
- validation errors -> `422`

## Example

```ts
app.post("/otp/generate", createGenerateChallengeHandler({ otpService }));
app.post("/otp/verify", createVerifyChallengeHandler({ otpService }));
```

## Reference

- example app: [examples/express-sms](../../../examples/express-sms/README.md)
- quickstart path: [examples/starter-express-sms](../../../examples/starter-express-sms/README.md)
