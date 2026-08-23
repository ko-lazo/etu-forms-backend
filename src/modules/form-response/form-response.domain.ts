import type { FormResponse } from "./form-response.types.js";

export function isSubmitted(response: FormResponse): boolean {
  return response.submittedAt !== null;
}
