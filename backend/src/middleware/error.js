export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
}
