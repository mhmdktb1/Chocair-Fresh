import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is missing.');
  }

  return jwt.sign({ id }, secret || 'test_jwt_secret_fallback', {
    expiresIn: '30d',
  });
};

export default generateToken;
