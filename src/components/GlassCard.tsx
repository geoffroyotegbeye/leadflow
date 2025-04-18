import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden"
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative p-8">
        {children}
      </div>

      {/* Bottom reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
    </motion.div>
  );
};

export default GlassCard;
