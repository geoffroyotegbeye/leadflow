import React, { useState, useEffect } from 'react';
import { ClockIcon, UserPlusIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import analyticsService, { RecentActivity } from '../../services/analyticsService';

// Mapper les types d'activité aux icônes correspondantes
const activityIcons = {
  lead: UserPlusIcon,
  conversation: ChatBubbleLeftRightIcon,
  assistant: SparklesIcon
};

const DashboardRecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getRecentActivity(5); // Limiter à 5 activités récentes
        setActivities(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des activités récentes:', err);
        setError('Impossible de charger les activités récentes');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <div className="flex items-center mb-4">
        <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activité récente</h2>
      </div>
      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {activities.length === 0 ? (
            <li className="py-3 text-center text-gray-500">Aucune activité récente</li>
          ) : (
            activities.map((item) => {
              const Icon = activityIcons[item.type as keyof typeof activityIcons];
              return (
                <li key={item.id} className="py-3 flex items-center">
                  <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.detail}</div>
                  </div>
                  <span className="ml-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{item.date}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
      {/* Notification rapide (exemple) */}
      <div className="mt-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 rounded-lg px-4 py-2 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5" />
          <span>2 nouveaux leads aujourd'hui !</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardRecentActivity;
