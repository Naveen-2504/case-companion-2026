export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "ERROR",
    public details?: unknown,
  ) {
    super(message);
  }
}
export const notFound = (what = "Resource") => new AppError(404, `${what} not found`, "NOT_FOUND");
export const badRequest = (msg: string, details?: unknown) => new AppError(400, msg, "BAD_REQUEST", details);
