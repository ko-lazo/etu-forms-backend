import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FORM_STATUS,
  canPublish,
  resolveFormStatus,
  type FormStatus,
} from "../form.domain.js";
import type { Form } from "../form.types.js";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

const now = new Date();
const past = new Date(now.getTime() - TWO_WEEKS_MS);
const future = new Date(now.getTime() + TWO_WEEKS_MS);

function makeFormRow(dates: Partial<Form>): Form {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    userId: "22222222-2222-4222-8222-222222222222",
    title: "Форма",
    schema: { pages: [] },
    settings: {},
    publishedAt: null,
    archivedAt: null,
    createdAt: past,
    updatedAt: past,
    ...dates,
  };
}

type StatusCase = {
  label: string;
  dates: Partial<Form>;
  expected: FormStatus;
};

describe("Статус формы", () => {
  it("определяется датами публикации", () => {
    const cases: StatusCase[] = [
      {
        label: "без дат (черновик)",
        dates: {},
        expected: FORM_STATUS.DRAFT,
      },
      {
        label: "публикация в прошлом (активна)",
        dates: { publishedAt: past },
        expected: FORM_STATUS.PUBLISHED,
      },
      {
        label: "публикация в будущем (запланирована)",
        dates: { publishedAt: future },
        expected: FORM_STATUS.SCHEDULED,
      },
    ];

    for (const { label, dates, expected } of cases) {
      assert.equal(resolveFormStatus(makeFormRow(dates), now), expected, label);
    }
  });
});

describe("Переходы жизненного цикла", () => {
  it("разрешают публикацию для черновиков", () => {
    const draftForm = makeFormRow({});
    assert.equal(canPublish(draftForm, now), true);
  });
});
