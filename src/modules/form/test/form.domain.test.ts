import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FORM_STATUS,
  canPublish,
  resolveFormStatus,
  type FormStatus,
} from "../form.domain.js";
import type { Form } from "../form.types.js";

const getTestDates = () => {
  const now = new Date();
  const past = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return { now, past, future };
};

function makeFormRow(dates: Partial<Form>): Form {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    userId: "22222222-2222-4222-8222-222222222222",
    title: "Форма",
    schema: { pages: [] },
    settings: {},
    publishedAt: null,
    archivedAt: null,
    createdAt: getTestDates().past,
    updatedAt: getTestDates().past,
    ...dates,
  };
}

describe("Статус формы", () => {
  it("определяется датами публикации", () => {
    const { now, past, future } = getTestDates();

    const cases: [string, Partial<Form>, FormStatus][] = [
      ["без дат (черновик)", {}, FORM_STATUS.DRAFT],
      [
        "публикация в прошлом (активна)",
        { publishedAt: past },
        FORM_STATUS.PUBLISHED,
      ],
      [
        "публикация в будущем (запланирована)",
        { publishedAt: future },
        FORM_STATUS.SCHEDULED,
      ],
    ];

    for (const [label, dates, expected] of cases) {
      assert.equal(resolveFormStatus(makeFormRow(dates), now), expected, label);
    }
  });
});

describe("Переходы жизненного цикла", () => {
  it("разрешают публикацию для черновиков", () => {
    const draftForm = makeFormRow({});
    assert.equal(canPublish(draftForm, getTestDates().now), true);
  });
});
