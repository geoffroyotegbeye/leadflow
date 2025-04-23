import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import sessionService, { Session, Message } from '../services/sessionService';
// Composant de chargement simple
interface SpinnerProps {
  size?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = "8" }) => (
  <div className="flex justify-center items-center p-4">
    <div className={`animate-spin rounded-full h-${size} w-${size} border-t-2 border-b-2 border-blue-500`}></div>
  </div>
);

interface Assistant {
  id: string;
  name: string;
}

const LeadsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const assistantIdFromQuery = queryParams.get('assistant');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(assistantIdFromQuery || '');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  // Utiliser une liste statique d'assistants pour le moment
  // car nous n'avons pas de méthode pour récupérer tous les assistants
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        // Liste statique d'assistants pour la démo
        const demoAssistants = [
          { id: "61a5c3d4e8f9", name: "Assistant Commercial" },
          { id: "72b6d4e5f9a0", name: "Support Client" },
          { id: "83c7e5f6a0b1", name: "RH Assistant" }
        ];
        
        setAssistants(demoAssistants);
        
        // Si aucun assistant n'est sélectionné et qu'il y a des assistants disponibles
        if (!selectedAssistantId && demoAssistants.length > 0) {
          setSelectedAssistantId(demoAssistants[0].id);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des assistants:', err);
        setError('Impossible de charger les assistants. Veuillez réessayer plus tard.');
      }
    };

    fetchAssistants();
  }, [selectedAssistantId]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedAssistantId) return;
      
      try {
        setLoading(true);
        const data = await sessionService.getAssistantSessions(selectedAssistantId);
        setSessions(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des sessions:', err);
        setError('Impossible de charger les sessions. Veuillez réessayer plus tard.');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [selectedAssistantId]);

  const handleAssistantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assistantId = e.target.value;
    setSelectedAssistantId(assistantId);
    setSelectedSession(null);
    setSessionMessages([]);
    setCurrentPage(1);
    
    // Mettre à jour l'URL avec le nouvel assistant sélectionné
    navigate(`/dashboard/leads?assistant=${assistantId}`);
  };

  const handleViewSession = async (session: Session) => {
    setSelectedSession(session);
    
    try {
      setLoadingMessages(true);
      const messages = await sessionService.getSessionMessages(session.id);
      setSessionMessages(messages);
    } catch (err) {
      console.error('Erreur lors de la récupération des messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Filtrer les sessions
  const filteredSessions = sessions.filter(session => {
    // Filtre par statut
    if (statusFilter !== 'all' && session.status !== statusFilter) {
      return false;
    }
    
    // Filtre par statut de lead
    if (leadStatusFilter !== 'all' && session.lead_status !== leadStatusFilter) {
      return false;
    }
    
    // Recherche par ID ou info utilisateur
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const sessionIdMatch = session.id.toLowerCase().includes(searchLower);
      const userInfoMatch = session.user_info 
        ? Object.values(session.user_info).some(
            value => typeof value === 'string' && value.toLowerCase().includes(searchLower)
          )
        : false;
      
      return sessionIdMatch || userInfoMatch;
    }
    
    return true;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSessions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir le statut avec icône
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <ClockIcon className="w-3 h-3 mr-1" />
            En cours
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Terminée
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Abandonnée
          </span>
        );
      default:
        return status;
    }
  };

  // Obtenir le statut de lead avec icône
  const getLeadStatusBadge = (status: string) => {
    switch (status) {
      case 'none':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Non qualifié
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            Lead partiel
          </span>
        );
      case 'complete':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Lead complet
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads et Conversations</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Consultez et analysez les conversations avec vos utilisateurs
        </p>
      </div>

      {/* Filtres et sélection d'assistant */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="assistant-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assistant
            </label>
            <select
              id="assistant-select"
              value={selectedAssistantId}
              onChange={handleAssistantChange}
              className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {assistants.map(assistant => (
                <option key={assistant.id} value={assistant.id}>
                  {assistant.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statut de la conversation
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">En cours</option>
              <option value="completed">Terminées</option>
              <option value="abandoned">Abandonnées</option>
            </select>
          </div>

          <div>
            <label htmlFor="lead-status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statut du lead
            </label>
            <select
              id="lead-status-filter"
              value={leadStatusFilter}
              onChange={e => setLeadStatusFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Tous les leads</option>
              <option value="none">Non qualifiés</option>
              <option value="partial">Leads partiels</option>
              <option value="complete">Leads complets</option>
            </select>
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recherche
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Rechercher..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Sessions ({filteredSessions.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-4 text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-gray-500 dark:text-gray-400">
              <p>Aucune session trouvée.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Complétion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentItems.map((session, index) => (
                      <tr 
                        key={session.id} 
                        className={`${
                          selectedSession?.id === session.id 
                            ? 'bg-blue-50 dark:bg-blue-900/20' 
                            : index % 2 === 0 
                              ? 'bg-white dark:bg-gray-800' 
                              : 'bg-gray-50 dark:bg-gray-700'
                        } hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors`}
                        onClick={() => handleViewSession(session)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(session.started_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {getStatusBadge(session.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {getLeadStatusBadge(session.lead_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${session.completion_percentage}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              {Math.round(session.completion_percentage)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSession(session);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                          : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                          : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Suivant
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastItem, filteredSessions.length)}
                        </span>{' '}
                        sur <span className="font-medium">{filteredSessions.length}</span> résultats
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                            currentPage === 1
                              ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="sr-only">Précédent</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                            currentPage === totalPages
                              ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="sr-only">Suivant</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Détails de la session */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {selectedSession ? 'Détails de la conversation' : 'Sélectionnez une conversation'}
            </h2>
          </div>

          {selectedSession ? (
            <div className="p-4">
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">ID de session</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedSession.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de début</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(selectedSession.started_at)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</h3>
                  <p className="mt-1">{getStatusBadge(selectedSession.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut du lead</h3>
                  <p className="mt-1">{getLeadStatusBadge(selectedSession.lead_status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux de complétion</h3>
                  <div className="mt-1 flex items-center">
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedSession.completion_percentage}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {Math.round(selectedSession.completion_percentage)}%
                    </span>
                  </div>
                </div>
                {selectedSession.ended_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de fin</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDate(selectedSession.ended_at)}
                    </p>
                  </div>
                )}
              </div>

              {selectedSession.user_info && Object.keys(selectedSession.user_info).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Informations utilisateur</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {Object.entries(selectedSession.user_info).map(([key, value]) => (
                        <div key={key} className="col-span-1">
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{key}</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Conversation</h3>
                
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-64">
                    <Spinner size="md" />
                  </div>
                ) : sessionMessages.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Aucun message dans cette conversation.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto p-2">
                    {sessionMessages.map((message, index) => (
                      <div 
                        key={message.id}
                        className={`flex ${message.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div 
                          className={`max-w-3/4 rounded-lg px-4 py-2 ${
                            message.sender === 'bot'
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {message.content_type === 'form' ? (
                            <div>
                              <p className="text-sm font-medium mb-1">Formulaire soumis</p>
                              {message.metadata && (
                                <div className="text-xs space-y-1">
                                  {Object.entries(message.metadata).map(([key, value]) => (
                                    <div key={key}>
                                      <span className="font-medium">{key}:</span> {value as string}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          <p className="text-xs mt-1 opacity-70">
                            {formatDate(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <p>Sélectionnez une conversation pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;
