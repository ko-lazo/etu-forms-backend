export type FormResponseAnswer = string | number | boolean | string[];

/** Ответы на элементы формы в формате `<name элемента схемы>:ответ`  */
export type FormResponseAnswers = Record<string, FormResponseAnswer>;

export interface FormResponse {
  readonly id: string;
  readonly formId: string;
  readonly answers: FormResponseAnswers;
  readonly metadata: Record<string, unknown>;
  readonly submittedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type FormResponseCreate = Pick<
  FormResponse,
  "formId" | "answers" | "metadata" | "submittedAt"
>;

export type FormResponseUpdate = Pick<
  FormResponse,
  "answers" | "metadata" | "submittedAt"
>;
