import { BaseController } from "@/core/controllers/base.controller.js";
import type { FormService } from "./form.service.js";
import type { Form } from "./form.types.js";
import {
  CreateFormDto,
  FormResponseDto,
  UpdateFormDto,
} from "@/modules/form/form.dto.js";
import { FormPolicy } from "@/modules/form/form.policy.js";

export class FormController extends BaseController<
  Form,
  CreateFormDto,
  UpdateFormDto,
  FormResponseDto
> {
  constructor(formService: FormService, formPolicy: FormPolicy) {
    super(formService, formPolicy);
  }
}
