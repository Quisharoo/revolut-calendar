import "dotenv/config";
import type { Request, Response } from "express";
import { createApp } from "./createApp";
import { setupVite, serveStatic, log } from "./vite";

const bootstrapServer = async () => {
  const { app, server } = await createApp();

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return { app, server };
};

let cachedApp: Awaited<ReturnType<typeof createApp>> | null = null;

export default async function handler(req: Request, res: Response) {
  if (!cachedApp) {
    cachedApp = await createApp();
    serveStatic(cachedApp.app);
  }
  return cachedApp.app(req, res);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const { app, server } = await bootstrapServer();

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
