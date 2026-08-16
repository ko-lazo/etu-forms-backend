import { IResourcePolicy } from "@/core/policies/policy.interface.js";
import { ApiToken } from "./api-token.types.js";

export class ApiTokenPolicy implements IResourcePolicy<ApiToken> {
  view(userId: string, apiToken: ApiToken): boolean {
    return apiToken.userId === userId;
  }

  update(userId: string, apiToken: ApiToken): boolean {
    return apiToken.userId === userId;
  }

  delete(userId: string, apiToken: ApiToken): boolean {
    return apiToken.userId === userId;
  }
}

export const apiTokenPolicy = new ApiTokenPolicy();
