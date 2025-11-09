import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";

const app = new Hono();

app.use("*", cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[TRPC ERROR] Path: ${path}`);
      console.error('[TRPC ERROR] Code:', error.code);
      console.error('[TRPC ERROR] Message:', error.message);
      console.error('[TRPC ERROR] Stack:', error.stack);
    },
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
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
