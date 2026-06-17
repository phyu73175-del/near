const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    con: false,
    msg: err.message || "Internal Server Error"
  });
};

module.exports = errorMiddleware;