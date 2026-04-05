# Nest Adoption

Use `@otp-service/nest` when your service already uses Nest and wants OTP routes via a dynamic module instead of hand-writing controller glue.

## What It Provides

- `createNestOtpModule(...)`
- `createOtpController(...)`
- `OTP_SERVICE_TOKEN`

## Example Shape

```ts
const otpModule = createNestOtpModule({ otpService });

@Module({
  imports: [otpModule]
})
class AppModule {}
```

The package keeps OTP lifecycle behavior in `core`. Nest only contributes the module and controller integration layer.

## Validation Behavior

Malformed request bodies are mapped to `UnprocessableEntityException` with a `VALIDATION_ERROR` payload.

## Reference

- example app: [examples/nest-sms](../../../examples/nest-sms/README.md)
