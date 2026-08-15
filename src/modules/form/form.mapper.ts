import { IMapper } from "@/core/dto/mapper.interface.js";
import { isPubliclyVisible, resolveFormStatus } from "./form.domain.js";
import { type Form } from "./form.types.js";
import { formDto, FormResponseDto } from "./form.dto.js";

export const formMapper: IMapper<Form, FormResponseDto> = {
  toResponse(form: Form): FormResponseDto {
    const now = new Date();

    return formDto.responseSchema.parse({
      id: form.id,
      userId: form.userId,
      title: form.title,
      schema: form.schema,
      settings: form.settings,

      status: resolveFormStatus(form, now),
      isPublic: isPubliclyVisible(form, now),

      publishedAt: form.publishedAt,
      archivedAt: form.archivedAt,
      createdAt: form.createdAt,
    });
  },

  toResponseCollection(forms: Form[]): FormResponseDto[] {
    return forms.map((form) => this.toResponse(form));
  },
};
