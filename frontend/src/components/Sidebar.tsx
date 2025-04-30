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
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
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
  const { user, logout, isAuthenticated } = useAuth();

  // Nouvelle logique d'activation : path prefix
  const isMenuActive = (menuPath: string) => {
    // Toujours activer si location.pathname commence par menuPath
    return location.pathname === menuPath || location.pathname.startsWith(menuPath + '/');
  };

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
        <div className={`${collapsed ? 'ml-2 flex flex-col gap-1' : 'space-y-1'}`}>
          {menuItems.map((item) => {
            const isActive = isMenuActive(item.path);
            return (
              <div key={item.path}>
                {collapsed ? (
                  <Tooltip content={item.label} position="right">
                    <Link
                      to={item.path}
                      className={`flex items-center justify-center my-1 py-2 rounded-full w-10 h-10 mx-auto
                        ${
                          isActive
                            ? 'bg-blue-600/80 dark:bg-blue-500/70 text-white shadow-md'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                        ${collapsed ? 'transition-colors duration-200' : ''}
                      `}
                      style={{ minWidth: 40, minHeight: 40, transition: 'background 0.2s, color 0.2s' }}
                    >
                      <item.icon
                        className={`h-5 w-5 transition-colors duration-200 mx-auto`
                        }
                      />
                    </Link>
                  </Tooltip>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 my-1 text-sm font-medium rounded-lg transition-all duration-200 relative
                      ${
                        isActive
                          ? 'bg-blue-600/15 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-800/60'
                      }
                    `}
                  >
                    <span className={`flex items-center justify-center rounded-full transition-all duration-200 mr-3 w-9 h-9
                      ${
                        isActive
                          ? 'bg-blue-600/80 dark:bg-blue-500/70 text-white shadow'
                          : 'bg-transparent group-hover:bg-gray-200/60 dark:group-hover:bg-gray-800/60'
                      }
                    `}>
                      <item.icon
                        className={`h-5 w-5 transition-colors duration-200`
                        }
                      />
                    </span>
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
                      />
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Profile and Logout */}
      {isAuthenticated && user && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          {collapsed ? (
            <div className="flex flex-col items-center space-y-2">
              <Tooltip content={user.full_name} position="right">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <UserCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </Tooltip>
              <Tooltip content="Déconnexion" position="right">
                <button 
                  onClick={logout}
                  className="p-2 rounded-full bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <UserCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-800/20 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
