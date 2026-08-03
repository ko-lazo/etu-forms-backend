import { BaseError } from "./base-error.js";

export class ForbiddenError extends BaseError {
  readonly code = "FORBIDDEN";

  constructor(message = "You dont have permission to access this resource") {
    super(message, 403);
  }
}
