import "dotenv/config";
import type { Request, Response } from "express";

import { createApp } from "../server/createApp";

let cachedApp: Awaited<ReturnType<typeof createApp>> | null = null;

const initialize = async () => {
  if (!cachedApp) {
    cachedApp = await createApp({ mode: "production", enableStatic: true });
  }
  return cachedApp;
};

export default async function handler(req: Request, res: Response) {
  const app = await initialize();
  return app(req, res);
}
