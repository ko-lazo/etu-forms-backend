export const API_TOKEN_TYPE = {
  PERSONAL: "personal",
  SESSION: "session",
} as const;

export type ApiTokenType = (typeof API_TOKEN_TYPE)[keyof typeof API_TOKEN_TYPE];

export interface ApiToken {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly type: ApiTokenType;
  readonly token: string;
  readonly expiresAt: Date | null;
  readonly createdAt: Date;
}

export type ApiTokenCreate = Pick<
  ApiToken,
  "name" | "type" | "userId" | "token" | "expiresAt"
>;
export type ApiTokenUpdate = Partial<Pick<ApiToken, "name">>;

export type ApiTokenIssuance = {
  readonly name: string;
  readonly type: ApiTokenType;
  readonly expiresAt?: Date | null | undefined;
};
