import { ISubResourcePolicy } from "@/core/policies/policy.interface.js";
import type { FormResponse } from "./form-response.types.js";
import type { FormService } from "@/modules/form/form.service.js";
import type { FormPolicy } from "@/modules/form/form.policy.js";

export class FormResponsePolicy implements ISubResourcePolicy<FormResponse> {
  constructor(
    private readonly formService: FormService,
    private readonly formPolicy: FormPolicy,
  ) {}

  async create(userId: string | undefined, formId?: string): Promise<boolean> {
    if (!formId) return false;

    const form = await this.formService.findById(formId);
    if (!form) return false;

    return this.formPolicy.view(userId, form);
  }

  async view(
    userId: string | undefined,
    response: FormResponse,
  ): Promise<boolean> {
    const form = await this.formService.findById(response.formId);
    if (!form) return false;

    return this.formPolicy.view(userId, form);
  }

  async update(
    userId: string | undefined,
    response: FormResponse,
  ): Promise<boolean> {
    const form = await this.formService.findById(response.formId);
    if (!form) return false;

    // todo: if (!form.settings?.allowEditResponses) return false;

    return this.formPolicy.view(userId, form);
  }

  async delete(userId: string, response: FormResponse): Promise<boolean> {
    const form = await this.formService.findById(response.formId);
    if (!form) return false;

    return this.formPolicy.delete(userId, form);
  }
}
