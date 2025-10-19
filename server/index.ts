import "dotenv/config";
import { createServer, type RequestListener } from "http";

import { createApp } from "./createApp";
import { setupVite } from "./vite";
import { log } from "./logger";

const mode = (process.env.NODE_ENV as "development" | "production" | "test") ?? "development";

export default async function startServer() {
  const app = await createApp({ enableStatic: mode !== "development", mode });
  const requestListener = app as unknown as RequestListener;
  const server = createServer(requestListener);

  if (mode === "development") {
    await setupVite(app, server);
  }

  const port = Number.parseInt(process.env.PORT ?? "5000", 10);
  const fallbackPort = Number.parseInt(process.env.PORT_FALLBACK ?? "5001", 10);

  const listenOn = async (targetPort: number) =>
    new Promise<void>((resolve, reject) => {
      server.listen(
        {
          port: targetPort,
          host: "0.0.0.0",
          reusePort: true,
        },
        () => {
          log(`serving on port ${targetPort}`, "info", "server");
          resolve();
        }
      );

      server.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          reject(error);
        } else {
          reject(error);
        }
      });
    });

  try {
    await listenOn(port);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "EADDRINUSE") {
      log(`Port ${port} in use, trying fallback port ${fallbackPort}`, "warn", "server");
      await listenOn(fallbackPort);
    } else {
      throw error;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createApp };
