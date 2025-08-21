import axios from 'axios'
export const API = axios.create({
  baseURL: 'http://172.26.0.117:8000/api'
});

