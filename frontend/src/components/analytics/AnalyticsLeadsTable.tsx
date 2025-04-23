import React, { useState } from 'react';
import { ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import { LeadInfo } from '../../services/analyticsService';
import { useNavigate } from 'react-router-dom';

interface AnalyticsLeadsTableProps {
  leads: LeadInfo[];
  loading: boolean;
}

const AnalyticsLeadsTable: React.FC<AnalyticsLeadsTableProps> = ({ leads, loading }) => {
  const navigate = useNavigate();
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Formater le statut du lead
  const formatLeadStatus = (status: string) => {
    switch (status) {
      case 'partial':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            Partiel
          </span>
        );
      case 'complete':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            Complet
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Aucun
          </span>
        );
    }
  };

  // Gérer le clic sur "Voir la conversation"
  const handleViewConversation = (sessionId: string) => {
    navigate(`/dashboard/conversations/${sessionId}`);
  };

  // Basculer l'expansion d'un lead
  const toggleLeadExpansion = (leadId: string) => {
    if (expandedLeadId === leadId) {
      setExpandedLeadId(null);
    } else {
      setExpandedLeadId(leadId);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Leads récents</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Liste des leads générés récemment par vos assistants.
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-6">
          <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          Aucun lead récent trouvé.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Assistant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Complétion
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Informations
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {leads.map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => toggleLeadExpansion(lead.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {lead.assistant_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatLeadStatus(lead.lead_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${lead.completion_percentage}%` }}
                          ></div>
                        </div>
                        <span className="ml-2">{Math.round(lead.completion_percentage)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {Object.keys(lead.lead_info).length > 0 ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          {Object.keys(lead.lead_info).length} champs
                        </span>
                      ) : (
                        <span>Aucune information</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewConversation(lead.id);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-end"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Voir
                      </button>
                    </td>
                  </tr>
                  {expandedLeadId === lead.id && (
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <h4 className="font-medium mb-2">Informations du lead</h4>
                          {Object.keys(lead.lead_info).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(lead.lead_info).map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                  <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">{key}</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 dark:text-gray-400">Aucune information disponible</p>
                          )}
                          
                          {Object.keys(lead.user_info || {}).length > 0 && (
                            <>
                              <h4 className="font-medium mt-4 mb-2">Informations utilisateur</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(lead.user_info || {}).map(([key, value]) => (
                                  key !== 'timestamp' && (
                                    <div key={key} className="flex flex-col">
                                      <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">{key}</span>
                                      <span className="font-medium">{value}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnalyticsLeadsTable;
