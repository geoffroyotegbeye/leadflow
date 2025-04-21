import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassCard from '../components/GlassCard';
import Input from '../components/Input';
import { resetPassword } from '../services/auth';
import { useToast } from '../components/ui/ToastContainer';

const ResetPasswordPage: React.FC = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const { showToast } = useToast();
  const location = useLocation();

  // Récupérer le token depuis l'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      showToast({ 
        type: 'error', 
        message: 'Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.' 
      });
    }
  }, [location, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier que le token est présent
    if (!token) {
      showToast({ 
        type: 'error', 
        message: 'Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.' 
      });
      return;
    }
    
    // Vérifier que les mots de passe correspondent
    if (formData.password !== formData.confirmPassword) {
      showToast({ type: 'error', message: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    
    setLoading(true);
    
    try {
      // Appel à l'API de réinitialisation de mot de passe
      await resetPassword(token, formData.password);
      
      // Afficher un message de succès
      showToast({ 
        type: 'success', 
        message: 'Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.' 
      });
      
      setIsSubmitted(true);
      
      // Rediriger vers la page de connexion après un court délai
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
      
    } catch (err: any) {
      // Gestion des erreurs
      const errorMessage = err?.response?.data?.detail || "Erreur lors de la réinitialisation du mot de passe.";
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
                  Réinitialiser le mot de passe
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
                >
                  {!isSubmitted
                    ? "Choisissez un nouveau mot de passe sécurisé"
                    : "Votre mot de passe a été réinitialisé avec succès"}
                </motion.p>
              </div>

              {!isSubmitted ? (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 space-y-6"
                  onSubmit={handleSubmit}
                >
                  <div className="space-y-4">
                    <Input
                      label="Nouveau mot de passe"
                      type="password"
                      name="password"
                      id="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      icon={<LockClosedIcon className="w-5 h-5" />}
                    />
                    <Input
                      label="Confirmez le mot de passe"
                      type="password"
                      name="confirmPassword"
                      id="confirm-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      icon={<LockClosedIcon className="w-5 h-5" />}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !token}
                    className="group relative w-full flex justify-center py-3 px-4 rounded-xl
                      bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
                      text-white font-medium
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      transform transition-all duration-200
                      shadow-lg hover:shadow-xl
                      dark:focus:ring-offset-gray-900
                      disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="text-green-500 dark:text-green-400">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Votre mot de passe a été réinitialisé avec succès.
                  </p>
                  <Link
                    to="/login"
                    className="inline-block mt-4 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Retour à la connexion
                  </Link>
                </motion.div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
