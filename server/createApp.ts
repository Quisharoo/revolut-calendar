import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";

export interface CreateAppResult {
  app: Express;
  server: import("http").Server;
}

const createLoggingMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined;

    const originalResJson = res.json.bind(res) as Response["json"];
    res.json = function jsonProxy(bodyJson: any) {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson);
    } as Response["json"];

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = `${logLine.slice(0, 79)}…`;
        }
        console.info(logLine);
      }
    });

    next();
  };
};

export const createApp = async (): Promise<CreateAppResult> => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(createLoggingMiddleware());

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  return { app, server };
};
