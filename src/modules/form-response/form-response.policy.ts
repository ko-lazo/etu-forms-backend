import { type IResourcePolicy } from "@/core/policies/policy.interface.js";
import {
  isOwnedBy,
  type FormPolicy,
  type FormService,
} from "@/modules/form/index.js";
import { isSubmitted } from "./form-response.domain.js";
import type { FormResponse } from "./form-response.types.js";
export function createFormResponsePolicy(
  formService: FormService,
  formPolicy: FormPolicy,
): IResourcePolicy<FormResponse, string> {
  async function canViewForm(
    userId: string | undefined,
    formId: string,
  ): Promise<boolean> {
    const form = await formService.findById(formId);

    // todo: if (!form.settings?.allowEditResponses) return false;

    return form !== null && (await formPolicy.view(userId, form));
  }

  async function ownsForm(
    userId: string | undefined,
    formId: string,
  ): Promise<boolean> {
    const form = await formService.findById(formId);
    return form !== null && isOwnedBy(form, userId);
  }

  const canAccessResponse = (
    userId: string | undefined,
    response: FormResponse,
  ): Promise<boolean> =>
    isSubmitted(response)
      ? ownsForm(userId, response.formId)
      : canViewForm(userId, response.formId);

  return {
    view: canAccessResponse,
    create: (userId, formId) => canViewForm(userId, formId),
    update: canAccessResponse,
    delete: (userId, response) => ownsForm(userId, response.formId),
  };
}

export type FormResponsePolicy = ReturnType<typeof createFormResponsePolicy>;
