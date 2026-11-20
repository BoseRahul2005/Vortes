import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

// Interceptor to attach Clerk session token to every outgoing API request
API.interceptors.request.use(async (config) => {
  try {
    if (typeof window !== "undefined" && window.Clerk?.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn("Could not attach Clerk token to request:", err);
  }
  return config;
});

export default API;
