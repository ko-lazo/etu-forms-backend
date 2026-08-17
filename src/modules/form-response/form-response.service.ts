import { BaseService } from "@/core/services/base.service.js";
import type {
  FormResponse,
  FormResponseCreate,
  FormResponseUpdate,
} from "./form-response.types.js";
import { type FormResponseRepository } from "./db/form-response.repository.js";
import type { FormService } from "@/modules/form/index.js";
import { validateFormResponse } from "./form-response.validator.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";

export class FormResponseService extends BaseService<
  FormResponse,
  FormResponseCreate,
  FormResponseUpdate
> {
  constructor(
    protected override readonly repository: FormResponseRepository,
    private readonly formService: FormService,
  ) {
    super(repository);
  }

  override async create(data: FormResponseCreate): Promise<FormResponse> {
    const form = await this.formService.findById(data.formId);

    if (!form) {
      throw new NotFoundError("Form not found");
    }

    const errors = validateFormResponse(form.schema, data.answers);

    if (errors.length > 0) {
      throw new BadRequestError("Validation failed", errors);
    }

    return await super.create(data);
  }
}
