const handleValidationError = (err) => {
  // 1. Format the errors into a clean array
  const errorMessages = Object.values(err.errors).map((errorElement) => {
    return {
      path: errorElement.path,
      message: errorElement.message,
    };
  });

  // 2. Return the standardized error object
  return {
    statusCode: 400, // Bad Request (User's fault)
    message: "Validation Failed. Please check your input data.",
    errorMessages,
  };
};

export default handleValidationError;