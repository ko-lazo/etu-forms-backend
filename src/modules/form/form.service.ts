import { BaseService } from "../../core/services/base.service";

import type { Form, CreateFormInput, UpdateFormInput } from "./form.types";

import { FormRepository } from "./form.repository";

export class FormService extends BaseService<
  Form,
  CreateFormInput,
  UpdateFormInput
> {
  constructor(repository: FormRepository) {
    super(repository);
  }
}
