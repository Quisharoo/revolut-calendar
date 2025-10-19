type LogLevel = "info" | "warn" | "error" | "debug";

export const log = (message: string, level: LogLevel = "info", source = "express") => {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}`;

  switch (level) {
    case "error":
      console.error(entry);
      break;
    case "warn":
      console.warn(entry);
      break;
    case "debug":
      console.debug(entry);
      break;
    default:
      console.log(entry);
  }
};
