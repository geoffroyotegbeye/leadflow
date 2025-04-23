import axios from 'axios';
import { User } from '../types/user';

// Utilise la même base API que api.ts
const API_URL = 'http://localhost:8000/api';

const authClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
authClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// --- Fonctions d'authentification ---

export async function register(email: string, password: string, full_name: string, company_name?: string) {
  // S'assurer que les noms des champs correspondent exactement à ceux attendus par le backend
  const response = await authClient.post('/auth/register', { 
    email, 
    password, 
    full_name,
    company_name: company_name || null
  });
  return response.data;
}

export async function login(email: string, password: string) {
  // Utiliser l'endpoint spécifique pour la connexion par email
  const response = await authClient.post('/auth/login/email', { email, password });
  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await authClient.post('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(token: string, password: string) {
  const response = await authClient.post('/auth/reset-password', { token, password });
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await authClient.get('/auth/me');
  return response.data;
}

export async function updateUserProfile(userData: Partial<User>) {
  const response = await authClient.put('/auth/profile', userData);
  return response.data;
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const response = await authClient.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword });
  return response.data;
}

export function logout() {
  localStorage.removeItem('token');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

export default authClient;
