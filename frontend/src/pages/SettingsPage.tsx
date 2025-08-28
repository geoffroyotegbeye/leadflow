import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AccountSettings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  // Function to extract initials from full_name
  const getInitials = (fullName: string) => {
    if (!fullName) return '';
    const names = fullName.split(' ');
    return names
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2); // Limit to 2 initials
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <motion.button
        onClick={toggleDarkMode}
        className="fixed top-6 right-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </motion.button>

      <div className="max-w-3xl mx-auto p-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-4 mb-6"
        >
          Account Settings
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 flex items-center space-x-6"
        >
          <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {getInitials(user?.full_name || '')}
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                <p className="mt-1 text-gray-900 dark:text-gray-100">{user?.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                <p className="mt-1 text-gray-900 dark:text-gray-100">{user?.email}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
          >
            <FiLock className="text-gray-500 dark:text-gray-400" size={20} />
            <Link to="/forgot-password" className="text-gray-900 dark:text-gray-100">Change Password</Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 flex items-center space-x-3"
        >
          <FiTrash2 className="text-gray-500 dark:text-gray-400" size={20} />
          <div>
            <span className="text-gray-900 dark:text-gray-100">Delete Account</span>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Contact our support team to process the deletion of your account.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountSettings;