const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API Endpoint Not Found",
    errorMessages: [
      {
        path: req.originalUrl,
        // Adding req.method makes debugging 10x easier
        message: `The requested endpoint '${req.originalUrl}' with method '${req.method}' does not exist on this server.`,
      },
    ],
  });
};

export default notFoundHandler;