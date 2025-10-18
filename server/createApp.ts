import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";
import { log } from "./logger";

export interface CreateAppOptions {
  enableStatic?: boolean;
  mode?: "development" | "production" | "test";
}

const createRequestLogger = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: unknown;

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown, ...args: unknown[]) => {
      capturedJsonResponse = body;
      return (originalJson as unknown as (...params: unknown[]) => Response)(
        body,
        ...args
      );
    }) as typeof res.json;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (!path.startsWith("/api")) {
        return;
      }

      let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {
          // ignore JSON stringify errors
        }
      }

      if (line.length > 160) {
        line = `${line.slice(0, 157)}…`;
      }

      log(line);
    });

    next();
  };
};

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
