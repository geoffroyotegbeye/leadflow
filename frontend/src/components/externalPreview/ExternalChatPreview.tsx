import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowPathIcon, UserCircleIcon, PaperAirplaneIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import AssistantService from '../../services/api';
import ConfirmDialog from '../ui/ConfirmDialog';
import InlineMultiFieldForm from '../preview/InlineMultiFieldForm'
// import './ChatPreview.css';

// Interface pour les messages du chat
interface ChatMessage {
  id: string;
  content: string;
  type: string;
  sender: 'bot' | 'user';
  options?: string[];
  elementData?: any;
  timestamp: number;
  isTyping?: boolean;
  visible?: boolean;
}

// Composant pour le champ d'entrée inline
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

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue,
      type: 'input',
      sender: 'user',
      timestamp: Date.now(),
      visible: true
    };
    setMessages(prev => [...prev, userMessage]);

    const nextEdge = flowData.edges.find(
      (e: any) => e.source === currentNodeId && !e.sourceHandle
    );
    if (nextEdge) {
      const targetNode = flowData.nodes.find((n: any) => n.id === nextEdge.target);
      if (targetNode) {
        setCurrentNodeId(targetNode.id);
        processNodeElements(targetNode);
      } else {
        console.warn(`Nœud cible non trouvé pour l'edge : ${nextEdge.target}`);
      }
    } else {
      console.warn(`Aucune edge sortante pour le nœud : ${currentNodeId}`);
    }
    setInputValue('');
  }, [inputValue, validateInput, setMessages, flowData, currentNodeId, setCurrentNodeId, processNodeElements]);

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
    </motion.div>
  );
};

// Composant pour formulaire multi-champs
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

  const showDescriptionInForm = !element.formDescriptionAsMessage;

  const handleSubmit = (formData: { [key: string]: string }) => {
    const formattedContent = Object.entries(formData)
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: formattedContent,
      type: 'form',
      sender: 'user',
      timestamp: Date.now(),
      visible: true
    };
    setMessages(prev => [...prev, userMessage]);

    const nextEdge = flowData.edges.find(
      (e: any) => e.source === currentNodeId && !e.sourceHandle
    );
    if (nextEdge) {
      const targetNode = flowData.nodes.find((n: any) => n.id === nextEdge.target);
      if (targetNode) {
        setCurrentNodeId(targetNode.id);
        processNodeElements(targetNode);
      } else {
        console.warn(`Nœud cible non trouvé pour l'edge : ${nextEdge.target}`);
      }
    } else {
      console.warn(`Aucune edge sortante pour le nœud : ${currentNodeId}`);
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

const ExternalChatPreview: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [flowData, setFlowData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Récupérer les données du flow depuis l'endpoint /chat/{public_id}/flow
  useEffect(() => {
    if (publicId) {
      console.log('useEffect exécuté avec publicId:', publicId);
      setIsLoading(true);
      setError(null);
      AssistantService.getAssistantFlow(publicId)
        .then(data => {
          console.log('Données récupérées:', data);
          setFlowData({ nodes: data.nodes || [], edges: data.edges || [] });
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Erreur lors de la récupération du flow:', err);
          setError('Impossible de charger les données du chatbot.');
          setIsLoading(false);
        });
    } else {
      setError('Aucun ID public fourni dans l\'URL.');
      setIsLoading(false);
    }
  }, [publicId]);

  // Traiter les éléments d'un nœud
  const processNodeElements = useCallback((node: any) => {
    if (!node.data?.elements) return;

    const isEndNode = node.data.type === 'end';
    if (isEndNode) return;

    const processSequentially = (elements: any[], index: number) => {
      if (index >= elements.length) return;
      const element = elements[index];

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

        setTimeout(() => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === descriptionMessage.id ? { ...msg, isTyping: false, visible: true } : msg
            )
          );

          setTimeout(() => {
            const newMessage: ChatMessage = {
              id: `bot-${Date.now()}-${index}`,
              content: '',
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
          }, 1800);
        }, 1500 + Math.random() * 800);

        return;
      }

      const newMessage: ChatMessage = {
        id: `bot-${Date.now()}-${index}`,
        content: element.content || '',
        type: element.type,
        sender: 'bot',
        timestamp: Date.now(),
        isTyping: true,
        visible: false,
        elementData: element
      };

      if (element.type === 'question' && element.options && element.options.length > 0) {
        newMessage.options = element.options.map((opt: any) => opt.text);
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

  // Initialiser la conversation
  const initializeChat = useCallback(() => {
    if (!flowData.nodes.length) {
      console.log('[DEBUG] Impossible d\'initialiser le chat: données manquantes');
      return;
    }
    const startNode = flowData.nodes.find(node => node.data?.type === 'start');
    if (startNode) {
      setCurrentNodeId(startNode.id);
      processNodeElements(startNode);
    } else {
      console.error('[DEBUG] Aucun nœud de départ trouvé dans le flowData');
    }
  }, [flowData, processNodeElements]);

  useEffect(() => {
    if (!isLoading && flowData.nodes.length > 0) {
      initializeChat();
    }
  }, [isLoading, flowData, initializeChat]);

  // Faire défiler vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Gérer la réinitialisation
  const handleReload = useCallback(() => {
    setMessages([]);
    setCurrentNodeId(null);
    localStorage.removeItem(`leadflow:chat:${publicId}:chat`);
    initializeChat();
    setConfirmResetOpen(false);
  }, [publicId, initializeChat]);

  // Gérer le clic sur une option
  const handleOptionClick = (optionText: string, elementData: any) => {
    setSelectedOption(optionText);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: optionText,
      type: 'text',
      sender: 'user',
      timestamp: Date.now(),
      visible: true
    };
    setMessages(prev => [...prev, userMessage]);

    const matchedOption = elementData?.options?.find((opt: any) => opt.text === optionText);
    if (matchedOption) {
      const optionIndex = elementData.options.findIndex((opt: any) => opt.text === optionText);
      const questionId = elementData.id;
      const sourceHandle = `option-${questionId}-${optionIndex}`;

      const nextEdge = flowData.edges.find(
        (e: any) => e.source === currentNodeId && e.sourceHandle === sourceHandle
      );
      if (nextEdge) {
        const targetNode = flowData.nodes.find((node: any) => node.id === nextEdge.target);
        if (targetNode) {
          setCurrentNodeId(targetNode.id);
          processNodeElements(targetNode);
          setTimeout(() => setSelectedOption(null), 500);
        } else {
          console.warn(`Nœud cible non trouvé pour l'edge : ${nextEdge.target}`);
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}-error`,
            content: "Erreur : impossible de trouver la suite de la conversation.",
            type: 'text',
            sender: 'bot',
            timestamp: Date.now(),
            isTyping: true,
            visible: false
          }
        ]);
        setTimeout(() => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === `bot-${Date.now()}-error` ? { ...msg, isTyping: false, visible: true } : msg
            )
          );
        }, 1500);
      }
    }
  };

  // Gérer la soumission de texte
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: userInput,
      type: 'text',
      sender: 'user',
      timestamp: Date.now(),
      visible: true
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');

    const lastBotMessage = [...messages].reverse().find(
      msg => msg.sender === 'bot' && msg.options && msg.options.length > 0
    );

    if (lastBotMessage && lastBotMessage.elementData) {
      const matchedOption = lastBotMessage.elementData.options.find(
        (opt: any) => opt.text.toLowerCase() === userInput.toLowerCase()
      );
      if (matchedOption) {
        const optionIndex = lastBotMessage.elementData.options.findIndex(
          (opt: any) => opt.text.toLowerCase() === userInput.toLowerCase()
        );
        const questionId = lastBotMessage.elementData.id;
        const sourceHandle = `option-${questionId}-${optionIndex}`;

        const nextEdge = flowData.edges.find(
          (e: any) => e.source === currentNodeId && e.sourceHandle === sourceHandle
        );
        if (nextEdge) {
          const targetNode = flowData.nodes.find(node => node.id === nextEdge.target);
          if (targetNode) {
            setCurrentNodeId(targetNode.id);
            processNodeElements(targetNode);
          } else {
            console.warn(`Nœud cible non trouvé pour l'edge : ${nextEdge.target}`);
          }
        } else {
          setMessages(prev => [
            ...prev,
            {
              id: `bot-${Date.now()}-error`,
              content: "Je n'ai pas compris votre réponse. Veuillez choisir l'une des options proposées.",
              type: 'text',
              sender: 'bot',
              timestamp: Date.now(),
              isTyping: true,
              visible: false
            }
          ]);
          setTimeout(() => {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === `bot-${Date.now()}-error` ? { ...msg, isTyping: false, visible: true } : msg
              )
            );
          }, 1500);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Chargement du chatbot...</span>
      </div>
    );
  }

  if (error || !flowData) {
    return (
      <div className="p-4 text-red-500 text-center">
        {error || 'Erreur : Aucune donnée de chatbot disponible.'}
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Chatbot</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setExpandedView(!expandedView)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={expandedView ? 'Réduire le panel' : 'Élargir le panel'}
          >
            {expandedView ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setConfirmResetOpen(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Recommencer la conversation"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
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
                      {message.sender === 'user' ? null : showBotHeader ? (
                        <div className="flex items-center mb-1">
                          <UserCircleIcon className="h-5 w-5 mr-1 text-gray-500 dark:text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Bot</span>
                        </div>
                      ) : null}
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
                              {message.content.split('\n').map((line: string, idx: number) => {
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
                              <img
                                src={message.elementData.mediaUrl}
                                alt={message.content || 'Image'}
                                className="max-w-full rounded-t-lg max-h-64 object-contain mx-auto p-2"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                                }}
                              />
                              {message.content && <p className="p-3 text-sm border-t border-gray-100 dark:border-gray-700">{message.content}</p>}
                            </div>
                          ) : message.type === 'video' && message.elementData?.mediaUrl ? (
                            <div className="media-container bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                              <video
                                src={message.elementData.mediaUrl}
                                controls
                                className="max-w-full rounded-t-lg max-h-64 mx-auto p-2"
                              />
                              {message.content && <p className="p-3 text-sm border-t border-gray-100 dark:border-gray-700">{message.content}</p>}
                            </div>
                          ) : message.type === 'audio' && message.elementData?.mediaUrl ? (
                            <div className="media-container bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm p-3">
                              <audio
                                src={message.elementData.mediaUrl}
                                controls
                                className="w-full"
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
                                      alt={option.text || `Option ${index + 1}`}
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

      {(() => {
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
              const nextEdge = flowData.edges.find(
                (e: any) => e.source === currentNodeId && !e.sourceHandle
              );
              if (nextEdge) {
                const targetNode = flowData.nodes.find((n: any) => n.id === nextEdge.target);
                if (targetNode) {
                  setCurrentNodeId(targetNode.id);
                  processNodeElements(targetNode);
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

export default ExternalChatPreview;