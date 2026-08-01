import { BaseService } from "@/core/services/base.service.js";
import type { Form, FormCreate, FormUpdate } from "./form.types.js";
import { FormRepository } from "./form.repository.js";

export class FormService extends BaseService<Form, FormCreate, FormUpdate> {
  constructor(protected override readonly repository: FormRepository) {
    super(repository);
  }
}
