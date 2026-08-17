import { type IResourcePolicy } from "@/core/policies/policy.interface.js";
import type { FormPolicy, FormService } from "@/modules/form/index.js";

import type { FormResponse } from "./form-response.types.js";

export function createFormResponsePolicy(
  formService: FormService,
  formPolicy: FormPolicy,
): IResourcePolicy<FormResponse, string> {
  const canViewForm = async (
    userId: string | undefined,
    formId: string,
  ): Promise<boolean> => {
    const form = await formService.findById(formId);

    // todo: if (!form.settings?.allowEditResponses) return false;
    // todo: if (submittedAt) return false;

    return form !== null && (await formPolicy.view(userId, form));
  };

  return {
    view: (userId, response) => canViewForm(userId, response.formId),

    create: (userId, formId) => canViewForm(userId, formId),

    update: (userId, response) => canViewForm(userId, response.formId),

    delete: async (userId, response) => {
      const form = await formService.findById(response.formId);

      return form !== null && (await formPolicy.delete(userId, form));
    },
  };
}

export type FormResponsePolicy = ReturnType<typeof createFormResponsePolicy>;
