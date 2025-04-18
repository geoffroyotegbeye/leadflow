import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassCard from '../components/GlassCard';

const VerificationCodePage: React.FC = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Move to next input if value is entered
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length === 6) {
      setIsSubmitted(true);
      // TODO: Implement verification logic
      console.log('Verification attempt:', verificationCode);
    }
  };

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

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
                  Vérification
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
                >
                  {!isSubmitted
                    ? "Entrez le code de vérification envoyé à votre email"
                    : "Code vérifié avec succès"}
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
                  <div className="flex justify-center space-x-3">
                    {code.map((digit, index) => (
                      <motion.input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-2xl font-semibold rounded-xl
                          bg-white/10 dark:bg-gray-800/30
                          border border-white/10 dark:border-gray-700/30
                          text-gray-800 dark:text-gray-200
                          backdrop-blur-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50
                          transition-all duration-200"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      />
                    ))}
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Renvoyer le code
                    </button>
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
                    Vérifier le code
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
                    Votre compte a été vérifié avec succès.
                  </p>
                  <Link
                    to="/login"
                    className="inline-block mt-4 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Continuer vers la connexion
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

export default VerificationCodePage;
