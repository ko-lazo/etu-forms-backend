import { type IMapper } from "@/core/dto/mapper.interface.js";

import { type FormResponse } from "../form-response.types.js";
import { formResponseDto, type FormResponseDto } from "./form-response.dto.js";

export const formResponseMapper: IMapper<FormResponse, FormResponseDto> = {
  toResponse(response: FormResponse): FormResponseDto {
    return formResponseDto.responseSchema.parse({
      id: response.id,
      formId: response.formId,
      answers: response.answers,
      metadata: response.metadata,
      submittedAt: response.submittedAt,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    });
  },

  toResponseCollection(responses: FormResponse[]): FormResponseDto[] {
    return responses.map((response) => this.toResponse(response));
  },
};
