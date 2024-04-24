
const asyncHandler = clk => (req, res, next) => Promise.resolve(clk(req, res, next)).catch(next);
module.exports = asyncHandler;