import type { CorsOptions } from "cors";

import { env } from "./env.js";

export const corsConfig: CorsOptions = {
  origin: env.CORS_ORIGIN,
};
