  import { Form } from "@/modules/form/form.types.js";
  import { formMetadata } from "@/modules/form/form.metadata.js";
  import { BaseFilter } from "@/core/repositories/base.filter.js";
  import { FormQueryDto } from "@/modules/form/form.dto.js";

  export class FormFilter extends BaseFilter<Form> {
    protected readonly metadata = formMetadata;

    constructor(query: FormQueryDto) {
      super();
      if (query.title) this.title(query.title);
    }

    private title(value: string) {
      this.add(`${this.col("title")} ILIKE ?`, `%${value}%`);
    }
  }
