import React from 'react';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface AnalyticsOverviewProps {
  overview: {
    total_sessions: number;
    active_sessions: number;
    completed_sessions: number;
    abandoned_sessions: number;
    total_leads: number;
    partial_leads: number;
    complete_leads: number;
    average_completion_percentage: number;
    average_session_duration: number;
  } | null;
  loading: boolean;
}

const AnalyticsOverviewCards: React.FC<AnalyticsOverviewProps> = ({ overview, loading }) => {
  // Formater la durée en minutes et secondes
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes === 0) {
      return `${remainingSeconds} sec`;
    }
    
    return `${minutes} min ${remainingSeconds} sec`;
  };

  // Calculer le taux de conversion (leads / sessions)
  const conversionRate = overview 
    ? Math.round((overview.total_leads / overview.total_sessions) * 100) || 0
    : 0;

  // Calculer le taux de complétion (sessions complétées / total sessions)
  const completionRate = overview 
    ? Math.round((overview.completed_sessions / overview.total_sessions) * 100) || 0
    : 0;

  // Calculer le taux d'abandon (sessions abandonnées / total sessions)
  const abandonmentRate = overview 
    ? Math.round((overview.abandoned_sessions / overview.total_sessions) * 100) || 0
    : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-700 dark:text-yellow-300 mb-8">
        <p>Aucune donnée d'analytique disponible.</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Sessions',
      value: overview.total_sessions,
      icon: <UserGroupIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />,
      description: 'Nombre total de conversations',
      color: 'blue'
    },
    {
      title: 'Sessions Actives',
      value: overview.active_sessions,
      icon: <ArrowPathIcon className="h-6 w-6 text-purple-500 dark:text-purple-400" />,
      description: 'Conversations en cours',
      color: 'purple'
    },
    {
      title: 'Sessions Complétées',
      value: overview.completed_sessions,
      icon: <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400" />,
      description: `Taux de complétion: ${completionRate}%`,
      color: 'green'
    },
    {
      title: 'Sessions Abandonnées',
      value: overview.abandoned_sessions,
      icon: <XCircleIcon className="h-6 w-6 text-red-500 dark:text-red-400" />,
      description: `Taux d'abandon: ${abandonmentRate}%`,
      color: 'red'
    },
    {
      title: 'Total Leads',
      value: overview.total_leads,
      icon: <UserIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />,
      description: `Taux de conversion: ${conversionRate}%`,
      color: 'indigo'
    },
    {
      title: 'Leads Partiels',
      value: overview.partial_leads,
      icon: <UserIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />,
      description: 'Informations partiellement collectées',
      color: 'yellow'
    },
    {
      title: 'Leads Complets',
      value: overview.complete_leads,
      icon: <UserIcon className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />,
      description: 'Informations complètement collectées',
      color: 'emerald'
    },
    {
      title: 'Durée Moyenne',
      value: formatDuration(overview.average_session_duration),
      icon: <ClockIcon className="h-6 w-6 text-orange-500 dark:text-orange-400" />,
      description: 'Temps moyen par conversation',
      color: 'orange',
      isText: true
    },
    {
      title: 'Taux de Complétion',
      value: `${Math.round(overview.average_completion_percentage)}%`,
      icon: <ArrowTrendingUpIcon className="h-6 w-6 text-teal-500 dark:text-teal-400" />,
      description: 'Pourcentage moyen de complétion',
      color: 'teal',
      isText: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-t-4 border-${card.color}-500 dark:border-${card.color}-400`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {card.isText ? card.value : Number(card.value).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full">
              {card.icon}
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsOverviewCards;
