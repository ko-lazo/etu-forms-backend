export abstract class BaseError extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    public readonly statusCode: number,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = this.constructor.name;
  }
}
