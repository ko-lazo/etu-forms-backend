import { BaseError } from "./base-error.js";

export class TooManyRequestsError extends BaseError {
  readonly code = "TOO_MANY_REQUESTS";
  readonly details?: unknown;

  constructor(message = "Too many requests", details?: unknown) {
    super(message, 429);

    if (details) {
      this.details = details;
    }
  }
}
