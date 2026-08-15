import type { z } from "zod";
import type { JobContext } from "./job.context.js";
import type { JobResult } from "../job.types.js";

/**
 * Обработчик фоновой операции.
 */
export interface JobHandler<TPayload> {
  /** Тип операции из `jobs.type` */
  readonly type: string;

  /** Валидатор payload из JSONB */
  readonly payloadSchema: z.ZodType<TPayload>;

  handle(payload: TPayload, context: JobContext): Promise<JobResult>;
}
