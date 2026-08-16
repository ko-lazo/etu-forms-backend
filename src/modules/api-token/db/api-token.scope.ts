import { BaseScope } from "@/core/repositories/base.scope.js";
import { ApiToken } from "../api-token.types.js";
import { apiTokenMetadata } from "./api-token.metadata.js";

export class ApiTokenScope extends BaseScope<ApiToken> {
  constructor(userId: string) {
    super(apiTokenMetadata);

    this.add(`${this.col("userId")} = ?`, userId);
  }
}
