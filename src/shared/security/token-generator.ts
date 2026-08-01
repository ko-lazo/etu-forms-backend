import { randomBytes } from "node:crypto";

export class TokenGenerator {
  generate(size = 32): string {
    return randomBytes(size).toString("base64url");
  }
}
