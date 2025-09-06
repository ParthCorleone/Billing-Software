import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:49253/api', // Your server's URL from server.js
});

export default apiClient;