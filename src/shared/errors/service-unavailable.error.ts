import { BaseError } from "./base-error.js";

export class ServiceUnavailableError extends BaseError {
  readonly code = "SERVICE_UNAVAILABLE";

  constructor(message = "Service temporarily unavailable") {
    super(message, 503);
  }
}
