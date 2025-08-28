import React, { useState, useCallback } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { ChatMessage } from '../../types/types';

interface ChatInputProps {
  userInput: string;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (e: React.FormEvent) => void;
  lastInputMessage?: ChatMessage | null;
  flowData: { nodes: any[]; edges: any[] };
  currentNodeId: string | null;
  setCurrentNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  processNodeElements: (node: any) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  userInput,
  setUserInput,
  onSubmit,
  lastInputMessage,
  flowData,
  currentNodeId,
  setCurrentNodeId,
  setMessages,
  processNodeElements,
}) => {
  const [errorMsg, setErrorMsg] = useState('');

  const validateInput = useCallback(
    (value: string, inputType: string): boolean => {
      if (inputType === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        setErrorMsg('Veuillez entrer un email valide.');
        return false;
      }
      if (inputType === 'number' && value && isNaN(Number(value))) {
        setErrorMsg('Veuillez entrer un nombre valide.');
        return false;
      }
      setErrorMsg('');
      return true;
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    if (lastInputMessage?.elementData?.inputType) {
      if (!validateInput(userInput, lastInputMessage.elementData.inputType)) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content: userInput,
        type: 'input',
        sender: 'user',
        timestamp: Date.now(),
        visible: true,
      };
      setMessages((prev) => [...prev, userMessage]);
      setUserInput('');

      const nextEdge = flowData.edges.find((e) => e.source === currentNodeId && !e.sourceHandle);
      if (nextEdge) {
        const targetNode = flowData.nodes.find((n) => n.id === nextEdge.target);
        if (targetNode) {
          setCurrentNodeId(targetNode.id);
          processNodeElements(targetNode);
        }
      }
    } else {
      onSubmit(e);
    }
  };

  const inputType = lastInputMessage?.elementData?.inputType || 'text';
  const placeholder =
    lastInputMessage?.elementData?.content ||
    (inputType === 'email' ? 'Entrez votre email...' : inputType === 'number' ? 'Entrez un numéro...' : 'Tapez votre message...');

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex flex-col w-full gap-1">
        <div className="flex items-center">
          <input
            type={inputType}
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              if (lastInputMessage?.elementData?.inputType) {
                validateInput(e.target.value, inputType);
              }
            }}
            placeholder={placeholder}
            className="flex-1 rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <button 
          title='d'
            type="submit"
            className="p-2 rounded-r-md bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
            disabled={!userInput.trim() || !!errorMsg}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        {errorMsg && <span className="text-xs text-red-500 mt-1">{errorMsg}</span>}
      </div>
    </form>
  );
};

export default ChatInput;