import axios from 'axios';

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

// --- Fonctions d'authentification ---

export async function register(email: string, password: string, full_name: string, company_name?: string) {
  // S'assurer que les noms des champs correspondent exactement à ceux attendus par le backend
  return authClient.post('/auth/register', { 
    email, 
    password, 
    full_name,
    company_name: company_name || null
  });
}

export async function login(email: string, password: string) {
  // Utiliser l'endpoint spécifique pour la connexion par email
  return authClient.post('/auth/login/email', { email, password });
}

export async function forgotPassword(email: string) {
  return authClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string) {
  return authClient.post('/auth/reset-password', { token, password });
}

export default authClient;
