import React from 'react';
import { motion } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const stats = [
  {
    name: 'Chatbots Actifs',
    value: '12',
    change: '+2',
    icon: ChatBubbleLeftRightIcon,
    color: 'blue',
  },
  {
    name: 'Leads Générés',
    value: '2,847',
    change: '+18%',
    icon: UserGroupIcon,
    color: 'purple',
  },
  {
    name: 'Taux de Conversion',
    value: '24.3%',
    change: '+2.4%',
    icon: ChartBarIcon,
    color: 'green',
  },
  {
    name: 'Conversations',
    value: '14,281',
    change: '+15%',
    icon: ArrowTrendingUpIcon,
    color: 'orange',
  },
];

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Bonjour, John 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 dark:text-gray-400"
          >
            Voici un aperçu de vos performances
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          + Nouveau Chatbot
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                <stat.icon
                  className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-medium text-gray-900 dark:text-white mb-4"
        >
          Activité Récente
        </motion.h2>
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[1, 2, 3].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Nouveau lead capturé
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      john.doe@example.com via Chatbot Support
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Il y a 5 min
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
