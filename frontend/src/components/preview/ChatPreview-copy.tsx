import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ArrowPathIcon, UserCircleIcon, PaperAirplaneIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

interface ChatMessage {
  id: string;
  content: string;
  type: string;
  sender: 'bot' | 'user';
  options?: string[];
  elementData?: any; // Pour stocker les données complètes de l'élément, y compris les targetNodeId
  timestamp: number;
}

interface ChatPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  assistantId?: string;
}

// Fonction pour obtenir la clé de stockage pour un assistant
const getStorageKey = (assistantId?: string) => {
  return assistantId ? `leadflow:assistant:${assistantId}` : 'leadflow:chatbot';
};

const ChatPreview: React.FC<ChatPreviewProps> = ({ isOpen, onClose, assistantId }) => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [flowData, setFlowData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Réinitialiser la conversation
  const handleReload = () => {
    if (assistantId) {
      setMessages([]);
      setCurrentNodeId(null);
      localStorage.removeItem(`${getStorageKey(assistantId)}:chat`);
      initializeChat();
    }
  };
  
  // Faire défiler vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger le flowchart depuis le localStorage
  useEffect(() => {
    try {
      const key = getStorageKey(assistantId);
      const data = localStorage.getItem(key);
      if (data) {
        const parsedData = JSON.parse(data);
        setFlowData(parsedData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du flowchart:', error);
    }
  }, [assistantId]);

  // Charger les messages sauvegardés
  useEffect(() => {
    if (assistantId) {
      const chatKey = `${getStorageKey(assistantId)}:chat`;
      const data = localStorage.getItem(chatKey);
      if (data) {
        try {
          const savedData = JSON.parse(data);
          if (savedData.messages && Array.isArray(savedData.messages)) {
            setMessages(savedData.messages);
          }
          if (savedData.currentNodeId) {
            setCurrentNodeId(savedData.currentNodeId);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des messages:', error);
        }
      } else {
        // Si pas de données sauvegardées, initialiser la conversation
        initializeChat();
      }
    }
  }, [assistantId]);

  // Sauvegarder l'état de la conversation
  useEffect(() => {
    if (assistantId && messages.length > 0) {
      const chatKey = `${getStorageKey(assistantId)}:chat`;
      localStorage.setItem(chatKey, JSON.stringify({
        messages,
        currentNodeId
      }));
    }
  }, [messages, currentNodeId, assistantId]);

  // Initialiser la conversation avec le nœud de départ
  const initializeChat = () => {
    const startNode = flowData.nodes.find(n => n.data?.type === 'start');
    if (startNode) {
      setCurrentNodeId(startNode.id);
      processNode(startNode);
    }
  };

  // Traiter un nœud et ajouter ses messages à la conversation
  const processNode = (node: any) => {
    if (!node || !node.data?.elements) return;
    
    const newMessages: ChatMessage[] = [];
    
    // Ajouter les éléments du nœud comme messages
    for (const el of node.data.elements) {
      if (el.type === 'question') {
        // Convertir les options au format attendu par le composant
        const formattedOptions = (el.options || []).map((opt: any) => opt.text || opt);
        
        // Vérifier et enrichir les données des options
        const enrichedElementData = {
          ...el,
          options: (el.options || []).map((opt: any) => {
            // S'assurer que chaque option a les informations nécessaires
            return {
              ...opt,
              text: opt.text || opt,
              targetNodeId: opt.targetNodeId || undefined
            };
          })
        };
        
        newMessages.push({
          id: el.id,
          content: el.content,
          type: el.type,
          sender: 'bot',
          options: formattedOptions,
          elementData: enrichedElementData, // Stocker l'élément enrichi
          timestamp: Date.now()
        });
      } else {
        newMessages.push({
          id: el.id,
          content: el.content,
          type: el.type,
          sender: 'bot',
          timestamp: Date.now()
        });
      }
    }
    
    if (newMessages.length > 0) {
      setMessages(prev => [...prev, ...newMessages]);
    }
  };

  // Gérer l'envoi d'un message utilisateur
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: userInput,
      type: 'text',
      sender: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    // Trouver le prochain nœud (simple pour l'instant, à améliorer avec logique de branchement)
    const nextEdge = flowData.edges.find(e => e.source === currentNodeId);
    if (nextEdge) {
      const nextNode = flowData.nodes.find(n => n.id === nextEdge.target);
      if (nextNode) {
        setCurrentNodeId(nextNode.id);
        // Ajouter un délai pour simuler une réponse
        setTimeout(() => processNode(nextNode), 500);
      }
    }
  };

  // Gérer le clic sur une option
  const handleOptionClick = (option: string, index: number) => {
    // Ajouter la réponse de l'utilisateur
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: option,
      type: 'option',
      sender: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Trouver le message de question correspondant (le dernier de type question)
    const questionMessage = [...messages].reverse().find(m => m.type === 'question' && m.elementData?.options);
    
    if (questionMessage && questionMessage.elementData?.options) {
      // Vérifier si l'option sélectionnée a un targetNodeId
      const selectedOption = questionMessage.elementData.options[index];
      
      console.log('Option sélectionnée:', selectedOption);
      
      if (selectedOption && selectedOption.targetNodeId) {
        console.log('Redirection vers le nœud:', selectedOption.targetNodeId);
        // Si l'option a un targetNodeId, aller directement à ce nœud
        const targetNode = flowData.nodes.find(n => n.id === selectedOption.targetNodeId);
        if (targetNode) {
          setCurrentNodeId(targetNode.id);
          // Ajouter un délai pour simuler une réponse
          setTimeout(() => processNode(targetNode), 500);
          return;
        } else {
          console.warn('Nœud cible non trouvé:', selectedOption.targetNodeId);
        }
      } else {
        console.log('Aucun targetNodeId défini pour cette option, suivant le flux normal');
      }
    } else {
      console.warn('Aucun message de question trouvé ou pas d\'options disponibles');
    }
    
    // Si pas de branchement spécifique, suivre le flux normal
    const nextEdge = flowData.edges.find(e => e.source === currentNodeId);
    if (nextEdge) {
      const nextNode = flowData.nodes.find(n => n.id === nextEdge.target);
      if (nextNode) {
        setCurrentNodeId(nextNode.id);
        // Ajouter un délai pour simuler une réponse
        setTimeout(() => processNode(nextNode), 500);
      } else {
        console.warn('Nœud suivant non trouvé dans le flux normal');
      }
    } else {
      console.warn('Aucune connexion trouvée depuis le nœud actuel:', currentNodeId);
    }
  };



  return (
    <div
      className={`fixed right-0 top-20 h-[calc(100vh-5rem)] bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${
        isOpen ? 'w-96' : 'w-0'
      }`}
    >
      {isOpen && (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <UserCircleIcon className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Assistant</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReload}
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                title="Recharger"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                title="Fermer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Affichage des messages simulés du flowchart */}
              {messages.length === 0 && (
                <div className="flex flex-col space-y-2">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%] self-start">
                    <p className="text-gray-900 dark:text-white">Aucun message à afficher. Ajoutez des éléments à votre flowchart ou cliquez sur <ArrowUturnLeftIcon className="inline-block w-4 h-4" /> pour initialiser la conversation.</p>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={msg.id} className={`flex flex-col space-y-2 mb-4 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}
                  >
                    <p>{msg.content}</p>
                    {msg.options && msg.options.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.options.map((option, optIdx) => {
                          // Vérifier si cette option a une liaison vers un nœud
                          const hasTargetNode = msg.elementData?.options && 
                                               msg.elementData.options[optIdx] && 
                                               msg.elementData.options[optIdx].targetNodeId;
                          
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleOptionClick(option, optIdx)}
                              className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors 
                                ${hasTargetNode 
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50 border-l-4 border-blue-500' 
                                  : 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-500'}`}
                            >
                              {option}
                              {hasTargetNode && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-300">
                                  (Lié à un nœud)
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Écrivez votre message..."
                className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
              <button 
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <PaperAirplaneIcon className="w-5 h-5 mr-1" />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPreview;
