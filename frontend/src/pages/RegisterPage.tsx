import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon, BuildingOfficeIcon, UserIcon } from '@heroicons/react/24/outline';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassCard from '../components/GlassCard';
import Input from '../components/Input';
import { register as registerApi } from '../services/auth';
import { useToast } from '../components/ui/ToastContainer';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    fullName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [loading, setLoading] = useState(false);
const { showToast } = useToast();

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Vérifier que les mots de passe correspondent
    if (formData.password !== formData.confirmPassword) {
      showToast({ type: 'error', message: 'Les mots de passe ne correspondent pas.' });
      setLoading(false);
      return;
    }
    
    try {
      // Appel à l'API d'inscription via le service auth
      // Transformer les noms des champs du formulaire pour qu'ils correspondent au backend
      await registerApi(
        formData.email, 
        formData.password, 
        formData.fullName, // full_name dans le backend
        formData.companyName // company_name dans le backend
      );
      
      // Afficher un message de succès
      showToast({ 
        type: 'success', 
        message: 'Compte créé avec succès. Vous allez être redirigé vers la page de connexion.' 
      });
      
      // Rediriger vers la page de connexion après un court délai
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      
    } catch (err: any) {
      // Gestion des erreurs
      const errorMessage = err?.response?.data?.detail || "Erreur lors de l'inscription.";
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
                  Créer un compte
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
                >
                  Ou{' '}
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    connectez-vous à votre compte existant
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
                    label="Nom complet"
                    type="text"
                    name="fullName"
                    id="full-name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    icon={<UserIcon className="w-5 h-5" />}
                  />
                  <Input
                    label="Nom de l'entreprise"
                    type="text"
                    name="companyName"
                    id="company-name"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    icon={<BuildingOfficeIcon className="w-5 h-5" />}
                  />
                  <Input
                    label="Adresse email"
                    type="email"
                    name="email"
                    id="email-address"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    icon={<EnvelopeIcon className="w-5 h-5" />}
                  />
                  <Input
                    label="Mot de passe"
                    type="password"
                    name="password"
                    id="password"
                    autoComplete="new-password"
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
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    icon={<LockClosedIcon className="w-5 h-5" />}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                    J'accepte les{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                      conditions d'utilisation
                    </a>
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="group relative w-full flex justify-center py-3 px-4 rounded-xl
                    bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
                    text-white font-medium
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    transform transition-all duration-200
                    shadow-lg hover:shadow-xl
                    dark:focus:ring-offset-gray-900
                    disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Création en cours...' : "S'inscrire"}
                </motion.button>
              </motion.form>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
