import express from "express";

import { errorHandler } from "@/shared/errors/error-handler.js";
import { notFoundMiddleware } from "@/shared/http/middleware/not-found.middleware.js";
import { container } from "@/app/app.container.js";
import { createApiRoutes } from "@/routes/api.routes.js";
import cors from "cors";
import { corsConfig } from "@/config/cors.config.js";
import { appConfig } from "@/config/app.config.js";

export function createApp() {
  container.init();

  const app = express();

  if (appConfig.isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(cors(corsConfig));

  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
    });
  });

  const apiRoutes = createApiRoutes();
  app.use("/api", apiRoutes);

  app.use(notFoundMiddleware);

  app.use(errorHandler);

  return app;
}
