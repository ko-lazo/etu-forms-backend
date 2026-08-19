import { aiConfig } from "@/config/index.js";
import { createAiService } from "./ai.service.js";

export function createAiModule() {
  return { service: createAiService(aiConfig) };
}
