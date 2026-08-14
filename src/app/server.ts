import type { Server } from "node:http";

import { createApp } from "./app.js";
import { appConfig } from "@/config/index.js";
import { pool } from "@/core/database/pool.js";
import { closeJobQueue } from "@/core/queue/job-queue.js";
import { logger } from "@/shared/logger/logger.js";
import { registerShutdownHandlers } from "@/shared/process/shutdown.js";

export function startServer(): Server {
  const app = createApp();

  const server = app.listen(appConfig.port, () => {
    logger.info(
      {
        port: appConfig.port,
        env: appConfig.env,
      },
      "HTTP-сервер запущен",
    );
  });

  return app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  registerShutdownHandlers({
    logger,
    shutdown: async () => {
      server.closeIdleConnections();

      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });

      await pool.end();
    },
  });

  return server;
}
