import { BaseError } from "./base-error.js";

export class ForbiddenError extends BaseError {
  readonly code = "FORBIDDEN";

  constructor(message = "You do not have permission to access this resource") {
    super(message, 403);
  }
}
