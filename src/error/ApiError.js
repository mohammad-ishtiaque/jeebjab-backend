class ApiError extends Error {
  constructor(statusCode, message, stack = "") {
    // 1. Call the parent class constructor with the message
    super(message);
    
    this.statusCode = statusCode;
    
    // 2. Set the precise name of the error class
    this.name = this.constructor.name;

    // 3. Handle the Stack Trace cleanly
    if (stack) {
      this.stack = stack;
    } else {
      // Hide this constructor logic from the error logs
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;