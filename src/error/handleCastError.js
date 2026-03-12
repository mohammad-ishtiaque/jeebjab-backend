const handleCastError = (error) => {
  // 1. Dynamic Error Message Array
  const errorMessages = [
    {
      path: error.path,
      message: `Invalid value '${error.value}' provided for field '${error.path}'.`,
    },
  ];

  // 2. Return Standardized Object
  return {
    statusCode: 400, // 400 Bad Request
    message: "Invalid Data Format (Cast Error)",
    errorMessages,
  };
};

export default handleCastError;