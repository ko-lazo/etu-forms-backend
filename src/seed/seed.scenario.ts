export type CountRange = { readonly min: number; readonly max: number };

export interface SeedScenario {
  readonly users: number;
  readonly formsPerUser: CountRange;
  readonly responsesPerForm: CountRange;
}

export const scenario: SeedScenario = {
  users: 100,
  formsPerUser: { min: 5, max: 10 },
  responsesPerForm: { min: 1000, max: 5000 },
};

export function counter({ min, max }: CountRange): () => number {
  return () => min + Math.floor(Math.random() * (max - min + 1));
}
