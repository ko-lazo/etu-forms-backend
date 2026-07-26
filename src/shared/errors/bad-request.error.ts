import { BaseError } from "./base-error.js";

export class BadRequestError extends BaseError {
  readonly code = "BAD_REQUEST";
  readonly details?: unknown;

  constructor(message = "Bad request", details?: unknown) {
    super(message, 400);

    if (details) {
      this.details = details;
    }
  }
}
