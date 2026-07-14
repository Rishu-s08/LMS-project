class ApiError extends Error {
  // 1. Declare class properties and their types first
  public statusCode: number;
  public errors: unknown[];
  public data: null;
  public success: boolean;

    constructor(
    statusCode: number,               // 2. Add explicit type
    message: string = "Something went wrong",
    errors: unknown[] = [],           // 3. Type the array
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = null;
    this.message = message;
    this.success = false;

    // 4. Restore prototype chain (Crucial for ES5 targets so instanceof works)
    Object.setPrototypeOf(this, ApiError.prototype);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };