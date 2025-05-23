import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, ArrowPathIcon, UserCircleIcon, PaperAirplaneIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import AssistantService from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatPreview.css';
import { useAssistantStore } from '../../stores/assistantStore';
import InlineMultiFieldForm from './InlineMultiFieldForm';
import { NodeType } from '../flowchart/NodeTypes';
import ConfirmDialog from '../ui/ConfirmDialog';

// Composant pour formulaire multi-champs dans le chat
interface InlineMultiFieldFormMessageProps {
  element: any;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentNodeId: string | null;
  setCurrentNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  flowData: { nodes: any[]; edges: any[] };
  processNodeElements: (node: any) => void;
}

const InlineMultiFieldFormMessage: React.FC<InlineMultiFieldFormMessageProps> = ({
  element,
  setMessages,
  currentNodeId,
  setCurrentNodeId,
  flowData,
  processNodeElements
}) => {
  if (!element.formFields) return null;

  // On n'affiche la description dans le formulaire que si elle n'a pas déjà été affichée comme message
  const showDescriptionInForm = !element.formDescriptionAsMessage;

  const handleSubmit = (values: Record<string, any>) => {
    // Formater les données du formulaire pour un affichage lisible
    const formattedContent = Object.entries(values)
      .map(([key, value]) => {
        // Récupérer le label du champ si disponible
        const field = element.formFields?.find((f: {name: string, label?: string}) => f.name === key);
        const label = field?.label || key;
        return `${label}: ${value}`;
      })
      .join('\n');

    // Ajoute la réponse utilisateur dans le chat avec les données formatées
    setMessages(prev => [
      ...prev,
      {
        id: `user-form-${Date.now()}`,
        content: formattedContent,
        type: 'form',
        sender: 'user',
        timestamp: Date.now(),
        visible: true,
        elementData: { formValues: values } // Stocker les valeurs brutes pour référence future
      }
    ]);
    // Passe au node suivant (logique simple: edge sortante)
    const nextEdge = flowData.edges.find(e => e.source === currentNodeId);
    if (nextEdge) {
      const nextNode = flowData.nodes.find(n => n.id === nextEdge.target);
      if (nextNode) {
        setCurrentNodeId(nextNode.id);
        processNodeElements(nextNode);
      }
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-4 mb-2 mx-2"
    >
      <InlineMultiFieldForm 
        fields={element.formFields} 
        onSubmit={handleSubmit} 
        description={showDescriptionInForm ? element.formDescription : undefined} 
      />
    </motion.div>
  );
};

// Composant pour l'entrée de texte inline dans la conversation
interface InlineInputFieldProps {
  message: ChatMessage;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentNodeId: string | null;
  setCurrentNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  flowData: { nodes: any[]; edges: any[] };
  processNodeElements: (node: any) => void;
}

const InlineInputField: React.FC<InlineInputFieldProps> = ({ 
  message, 
  setMessages, 
  currentNodeId, 
  setCurrentNodeId, 
  flowData, 
  processNodeElements 
}) => {
  const inputType = message.elementData?.inputType || 'text';
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Validation simple
  const validateInput = useCallback((value: string): boolean => {
    if (inputType === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setErrorMsg("Veuillez entrer un email valide.");
      return false;
    }
    if (inputType === 'number' && value && isNaN(Number(value))) {
      setErrorMsg("Veuillez entrer un nombre valide.");
      return false;
    }
    setErrorMsg('');
    return true;
  }, [inputType]);
  
  const handleSubmitInput = useCallback(() => {
    if (!inputValue.trim() || !validateInput(inputValue)) return;
    
    // Créer un message utilisateur avec la réponse
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue,
      type: 'input',
      sender: 'user',
      timestamp: Date.now(),
      visible: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Passer au nœud suivant
    if (message.elementData && message.elementData.options && message.elementData.options[0]?.targetNodeId) {
      const targetNodeId = message.elementData.options[0].targetNodeId;
      const targetNode = flowData.nodes.find(n => n.id === targetNodeId);
      if (targetNode) {
        setCurrentNodeId(targetNode.id);
        processNodeElements(targetNode);
      }
    } else {
      // Sinon, suivre le flux normal
      const nextEdge = flowData.edges.find(e => e.source === currentNodeId);
      if (nextEdge) {
        const nextNode = flowData.nodes.find(n => n.id === nextEdge.target);
        if (nextNode) {
          setCurrentNodeId(nextNode.id);
          processNodeElements(nextNode);
        }
      }
    }
  }, [inputValue, validateInput, message.elementData, setMessages, flowData, currentNodeId, setCurrentNodeId, processNodeElements]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    validateInput(e.target.value);
  }, [validateInput]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mt-3 flex flex-col gap-1"
    >
      <div className="w-full">
        <div className="flex items-center">
          <input
            type={inputType}
            value={inputValue}
            onChange={handleChange}
            placeholder={`Entrez votre ${inputType === 'email' ? 'email' : inputType === 'number' ? 'numéro' : 'réponse'}...`}
            className="flex-1 rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleSubmitInput}
            className="p-2 rounded-r-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            disabled={!inputValue.trim()}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        {errorMsg && <span className="text-xs text-red-500 mt-1">{errorMsg}</span>}
      </div>
    </motion.div>
  );
};

interface ChatMessage {
  id: string;
  content: string;
  type: string;
  sender: 'bot' | 'user';
  options?: string[];
  elementData?: any; // Pour stocker les données complètes de l'élément, y compris les targetNodeId
  timestamp: number;
  isTyping?: boolean; // Indique si le message est en cours d'écriture
  visible?: boolean; // Contrôle l'animation d'apparition
}

interface ChatPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  assistantId?: string;
}

// Fonction pour obtenir la clé de stockage pour un assistant
const getChatStorageKey = (assistantId?: string) => {
  return assistantId ? `leadflow:assistant:${assistantId}:chat` : 'leadflow:chatbot:chat';
};

const ChatPreview: React.FC<ChatPreviewProps> = ({ isOpen, onClose, assistantId }) => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [flowData, setFlowData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedView, setExpandedView] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Traiter les éléments d'un nœud
  const processNodeElements = useCallback((node: any) => {
    if (!node.data?.elements) return;

    // Vérifier si c'est un nœud de type END
    const isEndNode = node.data.type === NodeType.END || node.data.type === 'end';
    // Pour la prévisualisation, ne rien faire côté session

    const processSequentially = (elements: any[], index: number) => {
      if (index >= elements.length) return;
      const element = elements[index];
      
      // Si c'est un formulaire avec une description, ajouter d'abord la description comme message
      if (element.type === 'form' && element.formDescription) {
        const descriptionMessage: ChatMessage = {
          id: `bot-${Date.now()}-form-desc`,
          content: element.formDescription,
          type: 'text',
          sender: 'bot',
          timestamp: Date.now(),
          isTyping: true,
          visible: false
        };
        
        setMessages(prev => [...prev, descriptionMessage]);
        
        // Afficher la description après un délai
        setTimeout(() => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === descriptionMessage.id ? { ...msg, isTyping: false, visible: true } : msg
            )
          );
          
          // Ensuite traiter l'élément formulaire normalement
          setTimeout(() => {
            // N'afficher le formulaire que si la description est visible
            const newMessage: ChatMessage = {
              id: `bot-${Date.now()}-${index}`,
              content: '', // S'assurer qu'il n'y a pas de texte inutile
              type: element.type,
              sender: 'bot',
              timestamp: Date.now(),
              isTyping: true,
              visible: false,
              elementData: { ...element, formDescriptionAsMessage: true }
            };
            
            setMessages(prev => [...prev, newMessage]);
            
            setTimeout(() => {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === newMessage.id ? { ...msg, isTyping: false, visible: true } : msg
                )
              );
              
              setTimeout(() => {
                processSequentially(elements, index + 1);
              }, 600);
            }, 1500 + Math.random() * 800);
          }, 1800); // Délai augmenté à 1800ms pour laisser le temps de lire la description
        }, 1500 + Math.random() * 800);
        
        return;
      }
      
      // Traitement normal pour les autres types d'éléments
      const newMessage: ChatMessage = {
        id: `bot-${Date.now()}-${index}`,
        content: element.content || '',
        type: element.type,
        sender: 'bot',
        timestamp: Date.now(),
        isTyping: true,
        visible: false
      };
      // Stocker les données de l'élément dans le message
      newMessage.elementData = element;
      if (element.type === 'question' && element.options && element.options.length > 0) {
        newMessage.options = element.options.map((opt: any) => opt.text);
      } else if (element.type === 'input') {
        console.log('Élément input détecté:', element);
      } else if (['image', 'video', 'audio', 'file'].includes(element.type)) {
        console.log(`Élément ${element.type} détecté:`, element);
      }
      setMessages(prev => [...prev, newMessage]);
      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id ? { ...msg, isTyping: false, visible: true } : msg
          )
        );
        setTimeout(() => {
          processSequentially(elements, index + 1);
        }, 600);
      }, 1500 + Math.random() * 800);
    };
    processSequentially(node.data.elements, 0);
  }, []);
  
  // Initialiser la conversation avec le nœud de départ
  const initializeChat = useCallback(() => {
    if (!flowData.nodes.length || !assistantId) {
      console.log("%c[DEBUG] Impossible d'initialiser le chat: données manquantes", 'background: #ff0000; color: white');
      console.log('%c[DEBUG] flowData.nodes.length:', 'background: #ff0000; color: white', flowData.nodes.length);
      console.log('%c[DEBUG] assistantId:', 'background: #ff0000; color: white', assistantId);
      return;
    }
    // Trouver le nœud de départ
    const startNode = flowData.nodes.find(node => node.data?.type === 'start');
    console.log('%c[DEBUG] Nœud de départ trouvé:', 'background: #0000ff; color: white', startNode);
    if (startNode) {
      setCurrentNodeId(startNode.id);
      processNodeElements(startNode);
    } else {
      console.error("%c[DEBUG] Aucun nœud de départ trouvé dans le flowData", 'background: #ff0000; color: white; font-weight: bold');
    }
  }, [flowData, processNodeElements, assistantId]);

  // Faire défiler vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Utiliser le store Zustand pour accéder aux données du flowchart
  const { nodes: storeNodes, edges: storeEdges } = useAssistantStore();

  // Charger le flowchart depuis le store
  useEffect(() => {
    if (assistantId) {
      // Si les données sont déjà dans le store, les utiliser directement
      if (storeNodes.length > 0 || storeEdges.length > 0) {
        setFlowData({
          nodes: storeNodes,
          edges: storeEdges
        });
        setIsLoading(false);
      } else {
        // Sinon, charger depuis l'API
        setIsLoading(true);

        AssistantService.getById(assistantId)
          .then(assistant => {
            setFlowData({
              nodes: assistant.nodes || [],
              edges: assistant.edges || []
            });
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Erreur lors du chargement du flowchart:', error);
            setIsLoading(false);
          });
      }
    }
  }, [assistantId, storeNodes, storeEdges]);

  // Charger les messages sauvegardés
  useEffect(() => {
    if (assistantId && !isLoading) {
      const chatKey = getChatStorageKey(assistantId);
      const data = localStorage.getItem(chatKey);
      if (data) {
        try {
          const savedData = JSON.parse(data);
          if (savedData.messages && Array.isArray(savedData.messages) && savedData.messages.length > 0) {
            setMessages(savedData.messages);
            if (savedData.currentNodeId) {
              setCurrentNodeId(savedData.currentNodeId);
            }
            // Ne rien relancer côté bot, juste restaurer l'historique
            return;
          }
        } catch (error) {
          console.error('Erreur lors du chargement des messages:', error);
        }
      }
      // Si pas de messages sauvegardés, initialiser la conversation
      initializeChat();
    }
  }, [assistantId, isLoading, initializeChat]);

  // Sauvegarder l'état de la conversation
  useEffect(() => {
    if (assistantId && messages.length > 0) {
      const chatKey = getChatStorageKey(assistantId);
      localStorage.setItem(chatKey, JSON.stringify({
        messages,
        currentNodeId
      }));
    }
  }, [messages, currentNodeId, assistantId]);

  // Réinitialiser la conversation
  const handleReload = useCallback(() => {
    if (assistantId) {
      setMessages([]);
      setCurrentNodeId(null);
      localStorage.removeItem(getChatStorageKey(assistantId));
      initializeChat();
      setConfirmResetOpen(false);
    }
  }, [assistantId, initializeChat]);

  // Ouvrir la boîte de dialogue de confirmation pour réinitialiser
  const confirmReset = () => {
    setConfirmResetOpen(true);
  };

  // Gérer le redimensionnement du panel
  const toggleExpandView = () => {
    setExpandedView(!expandedView);
    // Donner le temps au DOM de se mettre à jour avant de faire défiler
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  // Gérer la soumission d'un message par l'utilisateur
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Ajouter le message de l'utilisateur
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: userInput,
      type: 'text',
      sender: 'user',
      timestamp: Date.now(),
      visible: true // Les messages de l'utilisateur sont immédiatement visibles
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');

    // Trouver le dernier message du bot avec des options
    const lastBotMessage = [...messages].reverse().find(
      msg => msg.sender === 'bot' && msg.options && msg.options.length > 0
    );

    if (lastBotMessage && lastBotMessage.elementData) {
      // Trouver l'option qui correspond au texte saisi par l'utilisateur
      const matchedOption = lastBotMessage.elementData.options.find(
        (opt: any) => opt.text.toLowerCase() === userInput.toLowerCase()
      );

      if (matchedOption && matchedOption.targetNodeId) {
        // Trouver le nœud cible
        const targetNode = flowData.nodes.find(node => node.id === matchedOption.targetNodeId);
        if (targetNode) {
          setCurrentNodeId(targetNode.id);
          processNodeElements(targetNode);
        }
      } else {
        // Si aucune option ne correspond, envoyer un message d'erreur
        const errorMessage: ChatMessage = {
          id: `bot-${Date.now()}-error`,
          content: "Je n'ai pas compris votre réponse. Veuillez choisir l'une des options proposées.",
          type: 'text',
          sender: 'bot',
          timestamp: Date.now(),
          isTyping: true,
          visible: false
        };

        setMessages(prev => [...prev, errorMessage]);

        // Après un délai, marquer le message comme terminé (plus en train d'être tapé)
        setTimeout(() => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === errorMessage.id ? { ...msg, isTyping: false, visible: true } : msg
            )
          );
        }, 1500);
      }
    }
  };

  // Gérer le clic sur une option
  const handleOptionClick = (optionText: string, elementData: any) => {
    // Définir l'option sélectionnée pour le style visuel
    setSelectedOption(optionText);

    // Ajouter le message de l'utilisateur avec l'option choisie
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: optionText,
      type: 'text',
      sender: 'user',
      timestamp: Date.now(),
      visible: true // Les messages de l'utilisateur sont immédiatement visibles
    };

    setMessages(prev => [...prev, userMessage]);

    // Trouver l'option correspondante dans les données de l'élément
    const matchedOption = elementData?.options?.find(
      (opt: any) => opt.text === optionText
    );

    if (matchedOption && matchedOption.targetNodeId) {
      // Trouver le nœud cible
      const targetNode = flowData.nodes.find(node => node.id === matchedOption.targetNodeId);
      if (targetNode) {
        setCurrentNodeId(targetNode.id);
        processNodeElements(targetNode);

        // Réinitialiser l'option sélectionnée après le traitement
        setTimeout(() => setSelectedOption(null), 500);
      }
    } else {
      // Réinitialiser l'option sélectionnée après un court délai si pas de navigation
      setTimeout(() => setSelectedOption(null), 500);
    }
  };

  // Rendu du composant
  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-0 right-0 h-full ${expandedView ? 'w-[600px]' : 'w-96'} bg-white dark:bg-gray-800 shadow-lg flex flex-col z-50 border-l border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Prévisualisation du chatbot</h2>
        <div className="flex space-x-2">
          <button
            onClick={toggleExpandView}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={expandedView ? "Réduire le panel" : "Élargir le panel"}
          >
            {expandedView ?
              <ArrowsPointingInIcon className="h-5 w-5" /> :
              <ArrowsPointingOutIcon className="h-5 w-5" />
            }
          </button>
          <button
            onClick={confirmReset}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Recommencer la conversation"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3">Chargement...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Aucun message</p>
            <button
              onClick={initializeChat}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Démarrer la conversation
            </button>
          </div>
        ) : (
          messages.map((message, idx) => {
            // Déterminer si l'entête Bot doit être affichée
            let showBotHeader = false;
            if (message.sender === 'bot') {
              if (idx === 0 || messages[idx - 1].sender !== 'bot') {
                showBotHeader = true;
              }
            }
            return (
              <AnimatePresence key={message.id}>
                {(message.visible || message.isTyping) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      {message.sender === 'user' ? null : (
                        showBotHeader ? (
                          <div className="flex items-center mb-1">
                            <UserCircleIcon className="h-5 w-5 mr-1 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Bot</span>
                          </div>
                        ) : null
                      )}
                      {message.isTyping ? (
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="text-sm"
                        >
                          {message.type === 'form' ? (
                            <div className="form-response">
                              {message.content.split('\n').map((line, idx) => {
                                const [label, value] = line.split(': ');
                                return (
                                  <div key={idx} className="mb-1">
                                    <span className="font-semibold">{label}:</span> {value}
                                  </div>
                                );
                              })}
                            </div>
                          ) : message.type === 'image' && message.elementData?.mediaUrl ? (
                            <div className="media-container bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                              <div className="relative w-full">
                                <img
                                  src={message.elementData.mediaUrl}
                                  alt={message.content || 'Image'}
                                  className="max-w-full rounded-t-lg max-h-64 object-contain mx-auto p-2"
                                  onError={(e) => {
                                    console.error("Erreur de chargement d'image:", message.elementData.mediaUrl);
                                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                                  }}
                                />
                              </div>
                              {message.content && <p className="p-3 text-sm border-t border-gray-100 dark:border-gray-700">{message.content}</p>}
                            </div>
                          ) : message.type === 'video' && message.elementData?.mediaUrl ? (
                            <div className="media-container bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                              <div className="relative w-full">
                                <video
                                  src={message.elementData.mediaUrl}
                                  controls
                                  className="max-w-full rounded-t-lg max-h-64 mx-auto p-2"
                                  onError={(e) => {
                                    console.error("Erreur de chargement vidéo:", message.elementData.mediaUrl);
                                  }}
                                />
                              </div>
                              {message.content && <p className="p-3 text-sm border-t border-gray-100 dark:border-gray-700">{message.content}</p>}
                            </div>
                          ) : message.type === 'audio' && message.elementData?.mediaUrl ? (
                            <div className="media-container bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm p-3">
                              <audio
                                src={message.elementData.mediaUrl}
                                controls
                                className="w-full"
                                onError={(e) => {
                                  console.error("Erreur de chargement audio:", message.elementData.mediaUrl);
                                }}
                              />
                              {message.content && <p className="mt-2 text-sm">{message.content}</p>}
                            </div>
                          ) : message.type === 'file' && message.elementData?.fileUrl ? (
                            <div className="media-container">
                              <a
                                href={message.elementData.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg my-2 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                                {message.content || 'Télécharger le fichier'}
                              </a>
                            </div>
                          ) : (
                            <p>{message.content}</p>
                          )}
                        </motion.div>
                      )}
                      {/* Afficher les options si présentes et que le message n'est plus en train d'être tapé */}
                      {message.sender === 'bot' && !message.isTyping && (
                        (message.options && message.options.length > 0) || (message.elementData?.options && message.elementData.options.length > 0)
                      ) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                          className="mt-2 space-y-1"
                        >
                          <div className="grid grid-cols-2 gap-2 py-2">
                            {/* Si nous avons des options avec images dans elementData (nouveau format) */}
                            {message.elementData?.options && message.elementData.options.length > 0 ? (
                              message.elementData.options.map((option: any, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => handleOptionClick(option.text, message.elementData)}
                                  className={
                                    `flex flex-col items-center justify-center px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition w-full` +
                                    (selectedOption === option.text ? ' ring-2 ring-blue-500' : '')
                                  }
                                >
                                  {option.imageUrl && (
                                    <img
                                      src={option.imageUrl}
                                      alt={option.text || `Option ${index+1}`}
                                      className="h-12 w-12 object-cover rounded mb-1 border border-gray-200 dark:border-gray-600"
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://via.placeholder.com/80?text=Error';
                                      }}
                                    />
                                  )}
                                  {option.text && (
                                    <span className="text-xs text-gray-700 dark:text-gray-200 text-center break-words">{option.text}</span>
                                  )}
                                </button>
                              ))
                            ) : (
                              /* Convertir les options texte simples (ancien format) en nouveau format */
                              message.options && message.options.map((option, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleOptionClick(option, message.elementData)}
                                  className={
                                    `flex flex-col items-center justify-center px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition w-full` +
                                    (selectedOption === option ? ' ring-2 ring-blue-500' : '')
                                  }
                                >
                                  <span className="text-xs text-gray-700 dark:text-gray-200 text-center break-words">{option}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                      {/* Afficher le champ de saisie directement dans la conversation pour les entrées libres */}
                      {message.sender === 'bot' && !message.isTyping && message.type === 'input' && message.elementData && (
                        <InlineInputField
                          message={message}
                          setMessages={setMessages}
                          currentNodeId={currentNodeId}
                          setCurrentNodeId={setCurrentNodeId}
                          flowData={flowData}
                          processNodeElements={processNodeElements}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Affichage du formulaire multi-champs si le node courant est de type form */}
      {(() => {
        const currentNode = flowData.nodes.find(n => n.id === currentNodeId);
        if (currentNode && currentNode.data && currentNode.data.elements) {
          const formElement = currentNode.data.elements.find((el: any) => el.type === 'form');
          if (formElement) {
            return (
              <InlineMultiFieldFormMessage
                element={formElement}
                setMessages={setMessages}
                currentNodeId={currentNodeId}
                setCurrentNodeId={setCurrentNodeId}
                flowData={flowData}
                processNodeElements={processNodeElements}
              />
            );
          }
        }
        return null;
      })()}

      {/* Affichage dynamique du champ d'entrée selon l'élément attendu */}
      {(() => {
        // Chercher le dernier message du bot qui attend une entrée libre (input)
        const lastInputMsg = [...messages].reverse().find(
          msg => msg.sender === 'bot' && msg.type === 'input' && !msg.isTyping
        );
        if (lastInputMsg && lastInputMsg.elementData) {
          const inputType = lastInputMsg.elementData.inputType || 'text';
          let inputProps: any = {
            type: inputType,
            value: userInput,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value),
            placeholder: lastInputMsg.elementData.content || 'Votre réponse...',
            className: 'flex-1 rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500',
            autoFocus: true
          };
          // Validation simple
          let isValid = true;
          let errorMsg = '';
          if (inputType === 'email' && userInput && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(userInput)) {
            isValid = false;
            errorMsg = "Veuillez entrer un email valide.";
          }
          if (inputType === 'number' && userInput && isNaN(Number(userInput))) {
            isValid = false;
            errorMsg = "Veuillez entrer un nombre valide.";
          }
          return (
            <form onSubmit={e => {
              e.preventDefault();
              if (!isValid || !userInput.trim()) return;
              // Simuler la soumission comme handleSubmit
              const userMessage = {
                id: `user-${Date.now()}`,
                content: userInput,
                type: 'input',
                sender: 'user',
                timestamp: Date.now(),
                visible: true
              };
              setMessages(prev => [...prev, userMessage]);
              setUserInput('');
              // Passer au nœud suivant si défini
              if (lastInputMsg.elementData && lastInputMsg.elementData.options && lastInputMsg.elementData.options[0]?.targetNodeId) {
                const targetNodeId = lastInputMsg.elementData.options[0].targetNodeId;
                const targetNode = flowData.nodes.find(n => n.id === targetNodeId);
                if (targetNode) {
                  setCurrentNodeId(targetNode.id);
                  processNodeElements(targetNode);
                }
              } else {
                // Sinon, suivre le flux normal
                const nextEdge = flowData.edges.find(e => e.source === currentNodeId);
                if (nextEdge) {
                  const nextNode = flowData.nodes.find(n => n.id === nextEdge.target);
                  if (nextNode) {
                    setCurrentNodeId(nextNode.id);
                    processNodeElements(nextNode);
                  }
                }
              }
            }} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col w-full gap-1">
                <div className="flex items-center">
                  <input {...inputProps} />
                  <button
                    type="submit"
                    className="p-2 rounded-r-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    disabled={!userInput.trim() || !isValid}
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
                {errorMsg && <span className="text-xs text-red-500 mt-1">{errorMsg}</span>}
              </div>
            </form>
          );
        }
        // Sinon, champ texte classique (pour les autres cas)
        return (
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Tapez votre message..."
                className="flex-1 rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-2 rounded-r-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        );
      })()}
      {/* Boîte de dialogue de confirmation pour réinitialiser la conversation */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        title="Réinitialiser la conversation"
        message="Êtes-vous sûr de vouloir réinitialiser la conversation ? Tous les messages seront effacés."
        onConfirm={handleReload}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
};

export default ChatPreview;
