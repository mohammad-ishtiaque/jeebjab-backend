const createErrorMessage = (message, path = "") => [{ path, message }];

export default createErrorMessage;