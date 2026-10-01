import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
// Bind all interfaces so Render / Docker health checks can reach the process.
app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Osworth API listening on http://0.0.0.0:${env.PORT}`);
});
