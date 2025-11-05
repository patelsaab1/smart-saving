const apiResponse = ({ success = true, status = 200, message = '', data = {} }) => ({
  success,
  status,
  message,
  data,
});
export default apiResponse;