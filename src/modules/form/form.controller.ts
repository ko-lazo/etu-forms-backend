import { BaseController } from "../../core/controllers/base.controller";

import type { FormService } from "./form.service";

import type { Form, CreateFormInput, UpdateFormInput } from "./form.types";

export class FormController extends BaseController<
  Form,
  CreateFormInput,
  UpdateFormInput
> {
  constructor(formService: FormService) {
    super(formService);
  }
}
