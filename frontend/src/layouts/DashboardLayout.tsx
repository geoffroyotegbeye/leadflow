import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import Sidebar from '../components/Sidebar';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { collapsed } = useSidebar();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      
      {/* Main Content */}
      <div className={`${collapsed ? 'pl-20' : 'pl-64'} transition-all duration-300`}>
        {/* Top Bar */}
        <div className="h-16 sticky top-0 z-40 flex items-center justify-end px-6 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl shadow">
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

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
};

export default DashboardLayout;
