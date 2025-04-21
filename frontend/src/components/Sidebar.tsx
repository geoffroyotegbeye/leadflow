import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useSidebar } from '../context/SidebarContext';
import Tooltip from './ui/Tooltip';

const menuItems = [
  { path: '/dashboard', icon: HomeIcon, label: 'Tableau de bord' },
  { path: '/dashboard/chatbots', icon: ChatBubbleLeftRightIcon, label: 'Mes Chatbots' },
  { path: '/dashboard/analytics', icon: ChartBarIcon, label: 'Analytiques' },
  { path: '/dashboard/leads', icon: UserGroupIcon, label: 'Leads' },
  { path: '/dashboard/settings', icon: Cog6ToothIcon, label: 'Paramètres' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <div 
      className={`${collapsed ? 'w-20' : 'w-64'} h-screen bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800  fixed left-0 top-0 shadow-xl transition-all duration-300 z-30`}
    >
      {/* Logo and Toggle Button */}
      <div className={`p-6 flex ${collapsed ? 'justify-center' : 'justify-between'} items-center`}>
        {!collapsed && (
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            leadflow
          </span>
        )}
        <Tooltip content={collapsed ? "Déplier le menu" : "Replier le menu"}>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-gray-100/50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-colors"
          >
            {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
          </button>
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className={`${collapsed ? 'ml-4' : 'space-y-1'}`}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={item.path}>
                {collapsed ? (
                  <Tooltip content={item.label} position="right">
                    <Link
                      to={item.path}
                      className={`flex items-center justify-center py-3 text-sm font-medium rounded-xl transition-all duration-200
                        ${
                          isActive
                            ? 'bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                        }
                      `}
                    >
                      <item.icon
                        className={`mx-auto h-5 w-5 transition-colors duration-200
                          ${
                            isActive
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }
                        `}
                      />
                    </Link>
                  </Tooltip>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                      ${
                        isActive
                          ? 'bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                      }
                    `}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 transition-colors duration-200
                        ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      `}
                    />
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute right-5 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
                      />
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3 px-4'} py-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/30`}>
          {collapsed ? (
            <Tooltip content="John Doe" position="right">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-medium">
                JD
              </div>
            </Tooltip>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-medium">
              JD
            </div>
          )}
          {!collapsed && (
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">John Doe</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">john@example.com</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
