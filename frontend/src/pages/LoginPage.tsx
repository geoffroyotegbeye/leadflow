import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassCard from '../components/GlassCard';
import Input from '../components/Input';
import { login } from '../services/auth';
import { useToast } from '../components/ui/ToastContainer';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
const { showToast } = useToast();

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await login(email, password);
      // Stocker le token JWT dans localStorage
      localStorage.setItem("token", response.data.access_token);
      // Stocker les infos utilisateur si nécessaire
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      showToast({ type: 'success', message: 'Connexion réussie. Redirection...' });
      // Rediriger vers le tableau de bord
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000); // Petit délai pour voir le message de succès
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || "Erreur lors de la connexion";
      showToast({ type: 'error', message: errorMessage });
    }
    
    setLoading(false);
  };


  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-8 left-8"
        >
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            leadflow
          </span>
        </motion.div>

        <div className="max-w-md w-full">
          <GlassCard>
            <div className="space-y-8">
              <div>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                >
                  Connexion
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
                >
                  Ou{' '}
                  <Link
                    to="/register"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    créez un compte gratuitement
                  </Link>
                </motion.p>
              </div>

              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 space-y-6"
                onSubmit={handleSubmit}
              >
                <div className="space-y-4">
                  <Input
                    label="Adresse email"
                    type="email"
                    name="email"
                    id="email-address"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<EnvelopeIcon className="w-5 h-5" />}
                  />
                  <Input
                    label="Mot de passe"
                    type="password"
                    name="password"
                    id="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<LockClosedIcon className="w-5 h-5" />}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-600 dark:text-gray-400"
                    >
                      Se souvenir de moi
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link
                      to="/forgot-password"
                      className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Mot de passe oublié?
                    </Link>
                  </div>
                </div>

                
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  type="submit"
  disabled={loading}
  className="group relative w-full flex justify-center py-3 px-4 rounded-xl
    bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
    text-white font-medium
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    transform transition-all duration-200
    shadow-lg hover:shadow-xl
    dark:focus:ring-offset-gray-900
    disabled:opacity-70 disabled:cursor-not-allowed"
>
  {loading ? 'Connexion en cours...' : 'Se connecter'}
</motion.button>
              </motion.form>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
