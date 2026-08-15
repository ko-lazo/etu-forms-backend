import type { Logger } from "@/shared/logger/logger.js";
import type { ProgressUpdate } from "./job.repository.js";
import type { Job } from "./job.types.js";

/**
 * Контекст выполнения job.
 */
export interface JobContext {
  readonly job: Job;

  /** Сигнал выполнения отмены */
  readonly signal: AbortSignal;

  readonly logger: Logger;

  /**
   * Обновляет текущий прогресс выполнения
   */
  reportProgress(processed: number, total?: number): void;
}

export class JobRunContext implements JobContext {
  private processed = 0;
  private total: number | null;

  constructor(
    public readonly job: Job,
    public readonly signal: AbortSignal,
    public readonly logger: Logger,
  ) {
    this.total = job.totalCount;
  }

  public reportProgress(processed: number, total?: number): void {
    this.processed = processed;
    if (total !== undefined) {
      this.total = total;
    }
  }

  public get progress(): ProgressUpdate {
    return { processedCount: this.processed, totalCount: this.total };
  }
}
