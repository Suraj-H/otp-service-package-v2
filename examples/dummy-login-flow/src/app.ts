import { randomUUID } from "node:crypto";

import express from "express";
import type { Express } from "express";

import { createOtpService, hmacOtpSigner, type OtpService, type VerifyChallengeResult } from "@otp-service/core";
import {
  ExpressOtpValidationError,
  createGenerateChallengeHandler,
  createVerifyChallengeHandler
} from "@otp-service/express";
import { InMemoryChallengeStore, RecordingDelivery, createDeterministicOtpGenerator } from "@otp-service/testkit";

export interface CreateLoginDemoAppOptions {
  otpValues?: readonly string[];
}

export interface LoginDemoApp {
  app: Express;
  delivery: RecordingDelivery;
  otpService: OtpService;
}

/** In-memory sessions for the dummy login demo only. */
class SessionRegistry {
  private readonly byToken = new Map<string, { email: string }>();

  create(email: string): string {
    const token = randomUUID();
    this.byToken.set(token, { email });
    return token;
  }

  get(token: string | undefined): { email: string } | undefined {
    if (token === undefined) {
      return undefined;
    }

    return this.byToken.get(token);
  }
}

function requireEmailBody(body: unknown): string {
  if (typeof body !== "object" || body === null) {
    throw new ExpressOtpValidationError("Body must be an object.");
  }

  const record = body as Record<string, unknown>;
  if (typeof record.email !== "string" || record.email.trim().length === 0) {
    throw new ExpressOtpValidationError("email must be a non-empty string.");
  }

  return record.email.trim();
}

function requireVerifyLoginBody(body: unknown): { challengeId: string; code: string } {
  if (typeof body !== "object" || body === null) {
    throw new ExpressOtpValidationError("Body must be an object.");
  }

  const record = body as Record<string, unknown>;
  if (typeof record.challengeId !== "string" || record.challengeId.trim().length === 0) {
    throw new ExpressOtpValidationError("challengeId must be a non-empty string.");
  }

  if (typeof record.code !== "string" || record.code.trim().length === 0) {
    throw new ExpressOtpValidationError("code must be a non-empty string.");
  }

  return { challengeId: record.challengeId.trim(), code: record.code.trim() };
}

function bearerToken(header: string | undefined): string | undefined {
  if (header === undefined || !header.startsWith("Bearer ")) {
    return undefined;
  }

  return header.slice("Bearer ".length).trim() || undefined;
}

function statusForVerify(result: VerifyChallengeResult): number {
  switch (result.status) {
    case "VERIFIED":
      return 200;
    case "INVALID":
      return 400;
    case "EXPIRED":
      return 410;
    case "ATTEMPTS_EXCEEDED":
      return 429;
  }
}

export function createLoginDemoApp(options: CreateLoginDemoAppOptions = {}): LoginDemoApp {
  const app = express();
  const delivery = new RecordingDelivery();
  const sessions = new SessionRegistry();
  const generator = createDeterministicOtpGenerator(options.otpValues ?? ["123456", "654321", "111111"]);

  const otpService = createOtpService({
    challengeIdGenerator: () => randomUUID(),
    delivery,
    otpGenerator: () => generator.nextOtp(),
    policy: {
      maxVerifyAttempts: 3,
      otpLength: 6,
      ttlSeconds: 600
    },
    signer: hmacOtpSigner({
      secret: process.env.OTP_SECRET ?? "development-secret"
    }),
    store: new InMemoryChallengeStore()
  });

  const requestOtpHandler = createGenerateChallengeHandler({
    mapBody: (body) => ({
      channel: "email",
      purpose: "LOGIN",
      recipient: requireEmailBody(body)
    }),
    otpService
  });

  const rawVerifyHandler = createVerifyChallengeHandler({ otpService });

  app.use(express.json());

  app.post("/auth/login/request-otp", requestOtpHandler);

  app.post("/auth/login/verify", async (request, response, next) => {
    try {
      const { challengeId, code } = requireVerifyLoginBody(request.body);
      const result = await otpService.verifyChallenge({ challengeId, otp: code });

      if (result.status !== "VERIFIED") {
        response.status(statusForVerify(result)).json(result);
        return;
      }

      const sent = delivery.requests.find((r) => r.challengeId === challengeId);
      const recipient = sent?.recipient ?? delivery.lastRequest().recipient;
      const token = sessions.create(recipient);
      response.status(200).json({
        challengeId: result.challengeId,
        sessionToken: token,
        status: "LOGGED_IN"
      });
    } catch (error) {
      if (error instanceof ExpressOtpValidationError) {
        response.status(422).json({
          error: { code: "VALIDATION_ERROR", message: error.message }
        });
        return;
      }

      next(error);
    }
  });

  app.get("/auth/me", (request, response) => {
    const token = bearerToken(request.headers.authorization);
    const session = sessions.get(token);
    if (session === undefined) {
      response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing or invalid session." } });
      return;
    }

    response.json({ email: session.email, loggedIn: true });
  });

  app.post("/otp/generate", createGenerateChallengeHandler({ otpService }));
  app.post("/otp/verify", rawVerifyHandler);

  app.get("/auth/dev/last-otp", (_request, response) => {
    if (delivery.requests.length === 0) {
      response.status(404).json({ message: "No OTP has been sent yet." });
      return;
    }

    const last = delivery.lastRequest();
    response.json({
      hint: "Dev only — remove in production.",
      otp: last.otp,
      recipient: last.recipient
    });
  });

  return { app, delivery, otpService };
}
