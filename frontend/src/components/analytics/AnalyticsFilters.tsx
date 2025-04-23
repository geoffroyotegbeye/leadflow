import React from 'react';
import { 
  AdjustmentsHorizontalIcon, 
  CalendarIcon, 
  ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/outline';

interface AnalyticsFiltersProps {
  timeRange: number;
  setTimeRange: (range: number) => void;
  assistantId?: string;
  assistantName?: string;
  onAssistantChange?: () => void;
  isGlobal: boolean;
}

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({ 
  timeRange, 
  setTimeRange, 
  assistantId,
  assistantName,
  onAssistantChange,
  isGlobal
}) => {
  const timeRanges = [
    { value: 7, label: '7 jours' },
    { value: 30, label: '30 jours' },
    { value: 90, label: '3 mois' },
    { value: 180, label: '6 mois' },
    { value: 365, label: '1 an' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <AdjustmentsHorizontalIcon className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isGlobal ? 'Analytics Globales' : `Analytics: ${assistantName || 'Assistant'}`}
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Sélection de l'assistant (uniquement pour les analytics globales) */}
          {isGlobal && onAssistantChange && (
            <div className="relative">
              <button
                onClick={onAssistantChange}
                className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-gray-700 dark:text-gray-200">
                  {assistantId ? 'Changer d\'assistant' : 'Sélectionner un assistant'}
                </span>
              </button>
            </div>
          )}
          
          {/* Sélection de la période */}
          <div className="relative">
            <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
              <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 ml-3 mr-1" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="text-gray-700 dark:text-gray-200 py-2 pl-1 pr-8 bg-transparent border-none focus:ring-0 focus:outline-none appearance-none"
              >
                {timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsFilters;
