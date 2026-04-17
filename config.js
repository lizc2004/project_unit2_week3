const API_CONFIG = {
  baseUrl: "https://striveschool-api.herokuapp.com/api/product/",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWUyMmNhNjczOWY4NzAwMTU3YWIxZmIiLCJpYXQiOjE3NzY0MzAyNDYsImV4cCI6MTc3NzYzOTg0Nn0.fmp1C1oNTJJtEJgJl2rYctj68Ypt9mg5hF-CEkSvHhw",
};

function getAuthHeaders(includeJson = false) {
  const headers = {
    Authorization: `Bearer ${API_CONFIG.token}`,
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}
