import type { Logger } from "@/shared/logger/logger.js";
import { serializeError } from "@/shared/logger/logger.js";

export type ShutdownOptions = {
  readonly logger: Logger;
  readonly shutdown: () => Promise<void>;
  readonly timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Регистрирует обработчики SIGTERM/SIGINT для корректного завершения процесса.
 * При повторном сигнале или истечении таймаута принудительно завершает процесс.
 */
export function registerShutdownHandlers(options: ShutdownOptions): void {
  const { logger, shutdown, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  let shuttingDown = false;

  const handle = (signal: NodeJS.Signals): void => {
    if (shuttingDown) {
      logger.warn({ signal }, "Повторный сигнал, принудительный выход");
      process.exit(1);
    }

    shuttingDown = true;
    logger.info({ signal }, "Завершение работы");

    const timer = setTimeout(() => {
      logger.error({ timeoutMs }, "Таймаут завершения, принудительный выход");
      process.exit(1);
    }, timeoutMs);

    timer.unref();

    shutdown().then(
      () => {
        logger.info("Завершение выполнено");
        process.exit(0);
      },
      (error: unknown) => {
        logger.error(serializeError(error), "Ошибка при завершении");
        process.exit(1);
      },
    );
  };

  process.on("SIGTERM", handle);
  process.on("SIGINT", handle);
}
