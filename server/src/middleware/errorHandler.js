class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const asyncWrapper = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res, next) =>
  next(new AppError(`Route ${req.originalUrl} not found`, 404));

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message = 'Server Error' } = err;
  if (err.name === 'CastError') { message = 'Resource not found'; statusCode = 404; }
  if (err.code === 11000) { message = `${Object.keys(err.keyValue)[0]} already exists`; statusCode = 400; }
  if (err.name === 'ValidationError') { message = Object.values(err.errors).map(e => e.message).join(', '); statusCode = 400; }
  if (err.name === 'JsonWebTokenError') { message = 'Invalid token'; statusCode = 401; }
  res.status(statusCode).json({ success: false, message });
};

module.exports = { AppError, asyncWrapper, notFound, errorHandler };
