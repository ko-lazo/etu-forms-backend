import { BaseError } from "./base-error.js";

export class NotFoundError extends BaseError {
  readonly code = "NOT_FOUND";

  constructor(message = "Resource not found") {
    super(message, 404);
  }
}
