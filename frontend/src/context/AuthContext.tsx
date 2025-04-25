import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User } from '../types/user';
import { API_URL } from '../config';

// Configuration des cookies
const TOKEN_COOKIE = 'leadflow_token';
const USER_COOKIE = 'leadflow_user';
const COOKIE_EXPIRES = 7; // 7 jours

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, full_name: string, company_name?: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(Cookies.get(TOKEN_COOKIE) || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est authentifié au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = Cookies.get(TOKEN_COOKIE);
      console.log('Vérification du token d\'authentification:', storedToken ? 'Token présent' : 'Aucun token');
      
      // Essayer de récupérer l'utilisateur depuis les cookies
      const storedUser = Cookies.get(USER_COOKIE);
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('Utilisateur récupéré depuis les cookies:', userData);
        } catch (e) {
          console.error('Erreur lors de la récupération de l\'utilisateur depuis les cookies:', e);
        }
      }
      
      if (storedToken) {
        try {
          console.log('Tentative de vérification du token...');
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`
            }
          });
          console.log('Utilisateur authentifié avec succès:', response.data);
          setUser(response.data);
          setToken(storedToken);
          
          // Mettre à jour les cookies
          Cookies.set(TOKEN_COOKIE, storedToken, { expires: COOKIE_EXPIRES, sameSite: 'strict' });
          Cookies.set(USER_COOKIE, JSON.stringify(response.data), { expires: COOKIE_EXPIRES, sameSite: 'strict' });
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'authentification:', error);
          Cookies.remove(TOKEN_COOKIE);
          Cookies.remove(USER_COOKIE);
          setToken(null);
          setUser(null);
          
          // Rediriger vers la page de connexion si on est sur une page protégée
          if (window.location.pathname.includes('/dashboard') || 
              window.location.pathname.includes('/editor') ||
              window.location.pathname.includes('/settings')) {
            navigate('/login');
          }
        }
      } else {
        // Rediriger vers la page de connexion si on est sur une page protégée
        if (window.location.pathname.includes('/dashboard') || 
            window.location.pathname.includes('/editor') ||
            window.location.pathname.includes('/settings')) {
          console.log('Accès à une page protégée sans authentification, redirection vers login');
          navigate('/login');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/auth/login/email`, { email, password });
      const { access_token, user: userData } = response.data;
      
      // Stocker dans les cookies
      Cookies.set(TOKEN_COOKIE, access_token, { expires: COOKIE_EXPIRES, sameSite: 'strict' });
      Cookies.set(USER_COOKIE, JSON.stringify(userData), { expires: COOKIE_EXPIRES, sameSite: 'strict' });
      setToken(access_token);
      setUser(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove(TOKEN_COOKIE);
    Cookies.remove(USER_COOKIE);
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const register = async (email: string, password: string, full_name: string, company_name?: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/auth/register`, { 
        email, 
        password, 
        full_name,
        company_name: company_name || null
      });
      
      const { access_token, user: userData } = response.data;
      
      // Stocker dans les cookies
      Cookies.set(TOKEN_COOKIE, access_token, { expires: COOKIE_EXPIRES, sameSite: 'strict' });
      Cookies.set(USER_COOKIE, JSON.stringify(userData), { expires: COOKIE_EXPIRES, sameSite: 'strict' });
      setToken(access_token);
      setUser(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    register,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
