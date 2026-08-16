export interface ApiToken {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly token: string;
  readonly lastUsedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly createdAt: Date;
}

export type ApiTokenCreate = Pick<
  ApiToken,
  "name" | "userId" | "token" | "expiresAt"
>;
export type ApiTokenUpdate = Partial<Pick<ApiToken, "name">>;

export type ApiTokenIssuance = {
  readonly name: string;
  readonly expiresAt?: Date | null | undefined;
};
