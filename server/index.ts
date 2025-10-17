import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Setup the Express app
async function setupApp() {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
}

// Initialize the app for serverless deployment
let isInitialized = false;
async function initializeApp() {
  if (!isInitialized) {
    await registerRoutes(app);
    
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    serveStatic(app);
    isInitialized = true;
  }
  return app;
}

// For Vercel serverless deployment
export default async function handler(req: Request, res: Response) {
  const initializedApp = await initializeApp();
  return initializedApp(req, res);
}

// Only start the server if this file is run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const server = await setupApp();

    // ALWAYS serve the app on the port specified in the environment variable PORT.
    // Other ports are firewalled. Default to 5000 if not specified. This serves both
    // the API and the client and is the only port that is not firewalled. When the
    // preferred port is unavailable we fall back to an alternative so local dev keeps
    // running rather than crashing on start.
    const port = parseInt(process.env.PORT || "5000", 10);
    const fallbackPort = parseInt(process.env.PORT_FALLBACK || "5001", 10);

    const startServer = (portToTry: number) =>
      new Promise<void>((resolve, reject) => {
        const serverInstance = server.listen(
          {
            port: portToTry,
            host: "0.0.0.0",
            reusePort: true,
          },
          () => {
            log(`serving on port ${portToTry}`);
            resolve();
          }
        );

        serverInstance.on("error", (err: NodeJS.ErrnoException) => {
          if (err.code === "EADDRINUSE") {
            reject(err);
            return;
          }
          reject(err);
        });
      });

    try {
      await startServer(port);
    } catch (err: any) {
      if (err?.code === "EADDRINUSE") {
        log(`Port ${port} in use, trying fallback port ${fallbackPort}`);
        await startServer(fallbackPort);
      } else {
        throw err;
      }
    }
  })();
}
