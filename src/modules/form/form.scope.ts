import { MetadataAccessor } from "@/core/database/metdata-accessor.js";
import { Form } from "@/modules/form/form.types.js";
import {
  IConditionProvider,
  SqlCondition,
} from "@/core/database/sql-condition.interface.js";
import { formMetadata } from "@/modules/form/form.metadata.js";

export class FormScope
  extends MetadataAccessor<Form>
  implements IConditionProvider
{
  protected readonly metadata = formMetadata;

  constructor(private readonly userId: string) {
    super();
  }

  apply(): SqlCondition[] {
    return [
      {
        sql: `${this.col("userId")} = ?`,
        params: [this.userId],
      },
    ];
  }
}
