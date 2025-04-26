import React, { useState } from 'react';
import { ArrowPathIcon, EyeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { LeadInfo } from '../../services/analyticsService';
import { useNavigate } from 'react-router-dom';

// Étendre l'interface LeadInfo pour inclure les messages
interface LeadInfoWithMessages extends LeadInfo {
  conversations?: Array<{
    id: string;
    content: string;
    sender: string;
    timestamp: string | number;
    is_question?: boolean;
  }>;
  qa_pairs?: Array<{
    question: string;
    answer: string;
    timestamp: string | number;
  }>;
  form_submissions?: Array<{
    form_data: { [key: string]: string };
    timestamp: string | number;
  }>;
}

interface AnalyticsLeadsTableProps {
  leads: LeadInfoWithMessages[];
  loading: boolean;
}

const AnalyticsLeadsTable: React.FC<AnalyticsLeadsTableProps> = ({ leads, loading }) => {
  const navigate = useNavigate();
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // Log pour déboguer les leads reçus
  console.log('📝 AnalyticsLeadsTable - Leads reçus:', leads?.length, leads);

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

  // État pour suivre le lead dont la conversation est affichée
  const [conversationLeadId, setConversationLeadId] = useState<string | null>(null);
  
  // État pour suivre le lead dont les questions/réponses sont affichées
  const [qaLeadId, setQaLeadId] = useState<string | null>(null);
  
  // État pour suivre le lead dont les formulaires sont affichés
  const [formLeadId, setFormLeadId] = useState<string | null>(null);
  
  // Basculer l'expansion d'un lead
  const toggleLeadExpansion = (leadId: string) => {
    if (expandedLeadId === leadId) {
      setExpandedLeadId(null);
    } else {
      setExpandedLeadId(leadId);
    }
  };
  
  // Basculer l'affichage de la conversation d'un lead
  const toggleConversation = (leadId: string) => {
    if (conversationLeadId === leadId) {
      setConversationLeadId(null);
    } else {
      setConversationLeadId(leadId);
    }
  };
  
  // Basculer l'affichage des questions/réponses d'un lead
  const toggleQA = (leadId: string) => {
    if (qaLeadId === leadId) {
      setQaLeadId(null);
    } else {
      setQaLeadId(leadId);
    }
  };
  
  // Basculer l'affichage des formulaires d'un lead
  const toggleForm = (leadId: string) => {
    if (formLeadId === leadId) {
      setFormLeadId(null);
    } else {
      setFormLeadId(leadId);
    }
  };
  
  // Formater un message pour l'affichage
  const formatMessage = (message: any) => {
    const isBotMessage = message.sender === 'bot';
    const isQuestion = message.is_question;
    
    let messageClass = isBotMessage
      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
      : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    
    // Ajouter une classe spéciale pour les questions
    if (isQuestion) {
      messageClass += ' border-l-4 border-purple-500';
    }
    
    return (
      <div key={message.id} className={`p-3 rounded-lg my-2 ${messageClass} max-w-[80%] ${isBotMessage ? 'mr-auto' : 'ml-auto'}`}>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
          {isBotMessage ? 'Assistant' : 'Utilisateur'} - {formatDate(message.timestamp)}
          {isQuestion && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              Question
            </span>
          )}
        </div>
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    );
  };
  
  // Vérifier si un lead a des questions/réponses
  const hasQAPairs = (lead: LeadInfoWithMessages) => {
    return lead.qa_pairs && lead.qa_pairs.length > 0;
  };
  
  // Vérifier si un lead a des soumissions de formulaire
  const hasFormSubmissions = (lead: LeadInfoWithMessages) => {
    return lead.form_submissions && lead.form_submissions.length > 0;
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
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Session
                </th>
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
                  Source
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {leads.map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => toggleLeadExpansion(lead.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {lead.session_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {lead.chatbot_name || 'Assistant sans nom'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(lead.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatLeadStatus(lead.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {lead.source || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLeadExpansion(lead.id);
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                        title="Voir les détails"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Détails
                      </button>
                      
                      {/* Bouton pour afficher la conversation dans cette page */}
                      {lead.conversations && lead.conversations.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleConversation(lead.id);
                          }}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 ml-2"
                          title="Afficher/masquer la conversation"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                          Messages
                        </button>
                      )}
                      
                      {/* Bouton pour afficher les questions/réponses */}
                      {hasQAPairs(lead) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleQA(lead.id);
                          }}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 ml-2"
                          title="Afficher/masquer les questions/réponses"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Q/R
                        </button>
                      )}
                      
                      {/* Bouton pour afficher les formulaires */}
                      {hasFormSubmissions(lead) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleForm(lead.id);
                          }}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 ml-2"
                          title="Afficher/masquer les formulaires"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Form
                        </button>
                      )}
                    </td>
                  </tr>
                  
                  {/* Affichage des détails du lead */}
                  {expandedLeadId === lead.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <h4 className="font-medium mb-2">Informations utilisateur</h4>
                          {Object.entries(lead.user_info || {}).length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(lead.user_info || {}).map(([key, value]) => (
                                <div key={key} className="flex">
                                  <span className="font-medium mr-2">{key}:</span>
                                  <span>{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 dark:text-gray-400">Aucune information utilisateur disponible</p>
                          )}

                          {Object.entries(lead.lead_info || {}).length > 0 && (
                            <>
                              <h4 className="font-medium mt-4 mb-2">Informations lead</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(lead.lead_info || {}).map(([key, value]) => (
                                  <div key={key} className="flex">
                                    <span className="font-medium mr-2">{key}:</span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Affichage de la conversation complète */}
                  {conversationLeadId === lead.id && lead.conversations && lead.conversations.length > 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-blue-50 dark:bg-blue-900/10">
                        <div className="text-sm">
                          <h4 className="font-medium mb-4 text-blue-700 dark:text-blue-300 flex items-center">
                            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                            Conversation complète
                          </h4>
                          
                          <div className="space-y-2 max-h-96 overflow-y-auto p-2 border border-blue-100 dark:border-blue-800 rounded-lg">
                            {lead.conversations.map((message) => formatMessage(message))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Affichage des questions/réponses */}
                  {qaLeadId === lead.id && lead.qa_pairs && lead.qa_pairs.length > 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-purple-50 dark:bg-purple-900/10">
                        <div className="text-sm">
                          <h4 className="font-medium mb-4 text-purple-700 dark:text-purple-300 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Questions et réponses
                          </h4>
                          
                          <div className="space-y-4 max-h-96 overflow-y-auto p-2 border border-purple-100 dark:border-purple-800 rounded-lg">
                            {lead.qa_pairs.map((qa, index) => (
                              <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                                <div className="mb-2">
                                  <span className="font-medium text-purple-700 dark:text-purple-300">Question:</span>
                                  <p className="mt-1">{qa.question}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-green-700 dark:text-green-300">Réponse:</span>
                                  <p className="mt-1">{qa.answer}</p>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(qa.timestamp as string)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Affichage des soumissions de formulaire */}
                  {formLeadId === lead.id && lead.form_submissions && lead.form_submissions.length > 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/10">
                        <div className="text-sm">
                          <h4 className="font-medium mb-4 text-yellow-700 dark:text-yellow-300 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Soumissions de formulaire
                          </h4>
                          
                          <div className="space-y-4 max-h-96 overflow-y-auto p-2 border border-yellow-100 dark:border-yellow-800 rounded-lg">
                            {lead.form_submissions.map((submission, index) => (
                              <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                                <h5 className="font-medium mb-2 text-yellow-700 dark:text-yellow-300">
                                  Formulaire #{index + 1} - {formatDate(submission.timestamp as string)}
                                </h5>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(submission.form_data).map(([key, value]) => (
                                    <div key={key} className="flex">
                                      <span className="font-medium mr-2">{key}:</span>
                                      <span>{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
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
