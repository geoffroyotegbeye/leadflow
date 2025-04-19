import React from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, icon, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full px-4 py-3 rounded-xl bg-white/10 dark:bg-gray-800/30
            border border-blue/10 dark:border-gray-700/30
            text-gray-800 dark:text-gray-200
            placeholder-gray-400 dark:placeholder-gray-500
            backdrop-blur-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50
            transition-all duration-200
            ${icon ? 'pl-10' : ''}
          `}
          placeholder={label}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 dark:via-blue-400/20 to-transparent transform scale-x-0 transition-transform group-focus-within:scale-x-100" />
    </motion.div>
  );
};

export default Input;
