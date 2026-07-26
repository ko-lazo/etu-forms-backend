import { BaseService } from "@/core/services/base.service.js";

import type { Form, CreateFormInput, UpdateFormInput } from "./form.types.js";

import { FormRepository } from "./form.repository.js";

export class FormService extends BaseService<
  Form,
  CreateFormInput,
  UpdateFormInput
> {
  constructor(repository: FormRepository) {
    super(repository);
  }
}
