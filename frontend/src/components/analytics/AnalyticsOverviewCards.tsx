import React from 'react';
import { 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon, 
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { AnalyticsOverview } from '../../services/analyticsService';

interface AnalyticsOverviewCardsProps {
  overview: AnalyticsOverview | null;
  loading: boolean;
}

const AnalyticsOverviewCards: React.FC<AnalyticsOverviewCardsProps> = ({ overview, loading }) => {
  // Cartes de statistiques à afficher
  const stats = [
    {
      name: 'Leads générés',
      value: overview ? overview.total_leads : '-',
      icon: UserGroupIcon,
      color: 'blue',
      description: 'Total des leads capturés',
    },
    {
      name: 'Conversations',
      value: overview ? overview.total_sessions : '-',
      icon: ChatBubbleLeftRightIcon,
      color: 'green',
      description: 'Nombre total de conversations',
    },
    {
      name: 'Taux de conversion',
      value: overview && overview.total_sessions > 0 ? `${((overview.complete_leads || 0) / overview.total_sessions * 100).toFixed(1)}%` : '-',
      icon: ArrowTrendingUpIcon,
      color: 'purple',
      description: 'Pourcentage de leads complets',
    },
    {
      name: 'Taux de complétion',
      value: overview && overview.average_completion_percentage !== undefined ? `${overview.average_completion_percentage.toFixed(1)}%` : '-',
      icon: CheckCircleIcon,
      color: 'orange',
      description: 'Progression moyenne des conversations',
    },
    {
      name: 'Durée moyenne',
      value: overview && overview.average_session_duration !== undefined ? `${Math.round(overview.average_session_duration / 60)} min` : '-',
      icon: ClockIcon,
      color: 'pink',
      description: 'Durée moyenne des conversations',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      {stats.map((stat) => (
        <div 
          key={stat.name}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
              <p className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  stat.value
                )}
              </p>
            </div>
            <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
              <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {stat.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsOverviewCards;
