import { BaseController } from "@/core/controllers/base.controller.js";

import type { FormService } from "./form.service.js";

import type { Form, CreateFormInput, UpdateFormInput } from "./form.types.js";

export class FormController extends BaseController<
  Form,
  CreateFormInput,
  UpdateFormInput
> {
  constructor(formService: FormService) {
    super(formService);
  }
}
