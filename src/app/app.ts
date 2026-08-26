import express from "express";
import { errorHandler } from "@/shared/errors/error-handler.js";
import { notFoundMiddleware } from "@/shared/http/middleware/not-found.middleware.js";
import { apiRateLimit } from "@/shared/http/middleware/rate-limit.middleware.js";
import { container } from "@/app/app.container.js";
import { createApiRoutes } from "@/routes/api.routes.js";
import cors from "cors";
import { appConfig } from "@/config/index.js";
import { corsConfig } from "@/config/cors.config.js";
import { noStoreMiddleware } from "@/shared/http/middleware/no-store.middleware.js";

export function createApp() {
  container.init();

  const app = express();

  app.set("query parser", "extended");

  app.set("trust proxy", appConfig.trustProxy);

  app.use(cors(corsConfig));

  app.use(express.json({ limit: appConfig.jsonBodyLimit }));

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
    });
  });

  const apiRoutes = createApiRoutes();
  app.use("/api", apiRateLimit, noStoreMiddleware, apiRoutes);

  app.use(notFoundMiddleware);

  app.use(errorHandler);

  return app;
}
