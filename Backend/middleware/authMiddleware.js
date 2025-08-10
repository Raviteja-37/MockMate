const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // console.log('Middleware confirms userId is:', req.user.userId);
    // console.log('Received Token:', token);
    // console.log('Decoded Token:', decoded);
    next();
  } catch (error) {
    // console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};
