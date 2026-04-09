const { errorResponse } = require("../utils/apiResponse");

const notFound = (req, res) => {
  res.status(404).json(errorResponse("Route not found"));
};

module.exports = notFound;
