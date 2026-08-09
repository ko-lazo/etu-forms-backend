import { IResourcePolicy } from "@/core/policies/policy.interface.js";
import type { FormResponse } from "./form-response.types.js";
import type { FormService } from "@/modules/form/form.service.js";

export class FormResponsePolicy implements IResourcePolicy<FormResponse> {
  constructor(private readonly formService: FormService) {}

  async view(userId: string, response: FormResponse): Promise<boolean> {
    const form = await this.formService.findById(response.formId);

    return form?.userId === userId;
  }

  async update(userId: string, response: FormResponse): Promise<boolean> {
    const form = await this.formService.findById(response.formId);

    return form?.userId === userId;
  }

  async delete(userId: string, response: FormResponse): Promise<boolean> {
    const form = await this.formService.findById(response.formId);

    return form?.userId === userId;
  }
}
