const notFound = (req, res, next) => {
  const error = new Error(`No encontrado - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Prisma errors
  if (err.code === 'P2002') {
    message = 'Registro duplicado. Este valor ya existe.';
    statusCode = 409;
  } else if (err.code === 'P2025') {
    message = 'Registro no encontrado.';
    statusCode = 404;
  } else if (err.code === 'P2003') {
    message = 'Error de relación en la base de datos.';
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Token no válido';
    statusCode = 401;
  } else if (err.name === 'TokenExpiredError') {
    message = 'Token expirado';
    statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'Archivo demasiado grande';
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  notFound,
  errorHandler
}; 