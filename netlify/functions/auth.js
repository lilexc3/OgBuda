import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = async (event) => {
  const token = event.headers.authorization?.split(' ')[1];
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { statusCode: 200, userId: decoded.userId, isAuthenticated: true };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid token' }) };
  }
};

