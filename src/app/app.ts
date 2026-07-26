import express from "express";

import { errorHandler } from "../shared/errors/error-handler.js";
import { notFoundMiddleware } from "../shared/http/middleware/not-found.middleware";
import { apiRoutes } from "../routes/api.routes";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
    });
  });

  app.use("/api", apiRoutes);

  app.use(notFoundMiddleware);

  app.use(errorHandler);

  return app;
}
