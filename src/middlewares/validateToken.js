import jwt from 'jsonwebtoken'

async function validateToken(req, res, next) {

  const error = new Error();
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      error.message = "Unauthorized";
      error.status = 401;

      return next(error)
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next()
  } catch (error) {
    error.message = "Unknown Error";
    error.status = 401;

    return next(error)
  }

}

export default validateToken;