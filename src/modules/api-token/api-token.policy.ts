import { type IResourcePolicy } from "@/core/policies/policy.interface.js";
import { type ApiToken } from "./api-token.types.js";

export function createApiTokenPolicy(): IResourcePolicy<ApiToken> {
  const owns = (userId: string | undefined, apiToken: ApiToken) =>
    userId !== undefined && apiToken.userId === userId;

  return {
    view: owns,
    create: (userId) => userId !== undefined,
    update: owns,
    delete: owns,
  };
}

export type ApiTokenPolicy = ReturnType<typeof createApiTokenPolicy>;
