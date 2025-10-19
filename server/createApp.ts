import express, { type Express, type NextFunction, type Request, type Response } from "express";

import { createRequestLogger } from "./middleware/requestLogger";
import { serveStatic } from "./middleware/staticAssets";
import { log } from "./logger";
import { registerRoutes } from "./routes";

export interface CreateAppOptions {
  enableStatic?: boolean;
  mode?: "development" | "production" | "test";
}

export const createApp = async ({
  enableStatic,
  mode = (process.env.NODE_ENV as CreateAppOptions["mode"]) ?? "development",
}: CreateAppOptions = {}): Promise<Express> => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(createRequestLogger());

  await registerRoutes(app);

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number((error as { status?: number }).status) || 500
        : 500;
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: string }).message)
        : "Internal Server Error";

    if (status >= 500) {
      log(`${status} ${message}`, "error");
    }

    res.status(status).json({ message });
  });

  const shouldServeStatic = enableStatic ?? mode !== "development";
  if (shouldServeStatic) {
    serveStatic(app);
  }

  return app;
};
