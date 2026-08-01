export interface IAuthTokenValidator {
  validateToken(plainToken: string): Promise<{ userId: string } | null>;
}
