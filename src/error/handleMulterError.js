import createErrorMessage from "../util/createErrorMessage.js";

const handleMulterError = (err) => {
  let message;
  
  // 1. Destructure error properties
  const { code, field, message: defaultMsg } = err;
  
  // 2. Failsafe for undefined fields
  const safeField = field || "unknown_field";

  // 3. Comprehensive Switch Case
  switch (code) {
    case "LIMIT_UNEXPECTED_FILE":
      message = `Unexpected file found. Please check if the field name '${safeField}' is correct in your form.`;
      break;
    case "LIMIT_FILE_SIZE":
      message = `The file is too large for the '${safeField}' field. Please upload a smaller file.`;
      break;
    case "LIMIT_FILE_COUNT":
      message = `You uploaded too many files for the '${safeField}' field.`;
      break;
    default:
      message = defaultMsg || "A problem occurred while uploading the file.";
  }

  // 4. Return standard error object
  return {
    statusCode: 400, // Bad Request (User's fault)
    message: "File Upload Failed",
    errorMessages: createErrorMessage(message, safeField),
  };
};

export default handleMulterError;