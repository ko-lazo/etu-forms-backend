import { BaseService } from "@/core/services/base.service.js";

import type { Form } from "./form.types.js";

import { FormRepository } from "./form.repository.js";
import { CreateFormDto, UpdateFormDto } from "@/modules/form/form.dto.js";

export class FormService extends BaseService<
  Form,
  CreateFormDto,
  UpdateFormDto
> {
  constructor(repository: FormRepository) {
    super(repository);
  }
}
