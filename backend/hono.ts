import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";

const app = new Hono();

app.use("*", bodyLimit({
  maxSize: 500 * 1024 * 1024,
  onError: (c) => {
    return c.text('Bestand is te groot. Maximum toegestane grootte is 400MB', 413);
  },
}));

app.use("*", async (c, next) => {
  console.log('[HONO REQUEST]', c.req.method, c.req.url);
  await next();
  console.log('[HONO RESPONSE]', c.res.status);
});

app.options("*", (c) => {
  const origin = c.req.header("origin") ?? "*";
  c.header("Access-Control-Allow-Origin", origin);
  c.header("Vary", "Origin");
  c.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  c.header(
    "Access-Control-Allow-Headers",
    "content-type,authorization,x-client-info,apikey,trpc-batch-mode,x-trpc-source",
  );
  return c.body(null, 204);
});

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-client-info",
      "apikey",
      "trpc-batch-mode",
      "x-trpc-source",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: false,
  }),
);

const trpcHandler = trpcServer({
  router: appRouter,
  createContext,
  onError({ error, path }) {
    console.error(`[TRPC ERROR] Path: ${path}`);
    console.error("[TRPC ERROR] Code:", error.code);
    console.error("[TRPC ERROR] Message:", error.message);
    console.error("[TRPC ERROR] Stack:", error.stack);
  },
});

app.use("/api/trpc", trpcHandler);
app.use("/api/trpc/*", trpcHandler);


app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/healthz", (c) => {
  return c.json({ ok: true });
});

app.onError((err, c) => {
  console.error('[HONO ERROR]', err);
  return c.json(
    { 
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

export default app;
