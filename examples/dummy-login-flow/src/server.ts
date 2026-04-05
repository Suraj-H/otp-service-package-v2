import { createLoginDemoApp } from "./app.js";

const { app } = createLoginDemoApp();

const port = Number(process.env.PORT ?? "3010");
app.listen(port, () => {
  console.log(`Dummy login demo: http://127.0.0.1:${port}`);
  console.log("Try: POST /auth/login/request-otp → GET /auth/dev/last-otp → POST /auth/login/verify → GET /auth/me");
});
