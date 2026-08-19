import { z } from "zod";

import type { JobContext } from "./contract/job.context.js";
import { JobFatalError } from "./contract/job.error.js";
import type { JobHandler } from "./contract/job.handler.js";
import type { JobResult } from "./job.types.js";

type RegisteredHandler = (
  payload: unknown,
  context: JobContext,
) => Promise<JobResult>;

/**
 * Регистрация обработчиков фоновых задач. При регистрации
 * обработчику проставляется тип задачи для фильтрации в БД
 *
 * Список доступных обработчиков передаётся при запуске воркера.
 */
export class JobRegistry {
  private readonly handlers = new Map<string, RegisteredHandler>();

  public register<TPayload>(handler: JobHandler<TPayload>): this {
    if (this.handlers.has(handler.type)) {
      throw new Error(
        `Обработчик для типа "${handler.type}" уже зарегистрирован`,
      );
    }

    this.handlers.set(handler.type, (payload, context) => {
      const parsed = handler.payloadSchema.safeParse(payload);

      if (!parsed.success) {
        throw new JobFatalError(
          "INVALID_PAYLOAD",
          `Некорректный payload задачи "${handler.type}"`,
          z.treeifyError(parsed.error),
        );
      }

      return handler.handle(parsed.data, context);
    });

    return this;
  }

  /**
   * Запускает обработчик для указанного типа
   */
  public run(
    type: string,
    payload: unknown,
    context: JobContext,
  ): Promise<JobResult> {
    const handler = this.handlers.get(type);

    if (!handler) {
      throw new JobFatalError(
        "UNKNOWN_JOB_TYPE",
        `Нет обработчика для типа "${type}"`,
      );
    }

    return handler(payload, context);
  }

  public get types(): readonly string[] {
    return [...this.handlers.keys()];
  }
}
