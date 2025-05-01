const authorizePosition = (...allowedPositions) => {
  return (req, res, next) => {
    if (!req.user || !allowedPositions.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

export default authorizePosition;