import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import Sidebar from '../components/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      
      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <div className="h-16 flex items-center justify-end px-6 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg ${
              darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'
            } hover:bg-opacity-80 transition-colors duration-200`}
          >
            {darkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
