import type { NextFunction, Request, Response } from "express";

import { log } from "../logger";

export const createRequestLogger = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: unknown;

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown, ...args: unknown[]) => {
      capturedJsonResponse = body;
      return (originalJson as unknown as (...params: unknown[]) => Response)(body, ...args);
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
