import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassCard from '../components/GlassCard';
import Input from '../components/Input';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // TODO: Implement forgot password logic
    console.log('Forgot password request:', { email });
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
            LeadFlow
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
                  Mot de passe oublié
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
                >
                  {!isSubmitted
                    ? "Entrez votre email pour réinitialiser votre mot de passe"
                    : "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation"}
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
                      dark:focus:ring-offset-gray-900"
                  >
                    Envoyer le lien de réinitialisation
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
                    Vérifiez votre boîte de réception pour les instructions suivantes.
                  </p>
                </motion.div>
              )}

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Retour à la connexion
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
