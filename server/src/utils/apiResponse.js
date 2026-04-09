const successResponse = (data, message = "Success") => ({
  success: true,
  message,
  data,
});

const errorResponse = (message = "Something went wrong") => ({
  success: false,
  message,
});

module.exports = {
  successResponse,
  errorResponse,
};
