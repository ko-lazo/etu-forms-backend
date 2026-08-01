import { BaseError } from "./base-error.js";

export class UnauthorizedError extends BaseError {
  readonly code = "UNAUTHORIZED";

  constructor(message = "Authentication error") {
    super(message, 401);
  }
}
