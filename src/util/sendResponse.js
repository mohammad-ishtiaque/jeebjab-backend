/**
 * Standardized API Response Handler
 * @param {object} res - Express Response object
 * @param {object} data - Success, Message, Status, Data, etc.
 */
const sendResponse = (res, data) => {
  const responseData = {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message || null,
    meta: data.meta || undefined,
    data: data.data || null,
    // Activation token optional, unwanted hole delete hobe
    activationToken: data.activationToken || null,
  };

  if (responseData.activationToken === null) {
    delete responseData.activationToken;
  }

  res.status(data.statusCode).json(responseData);
};

export default sendResponse;