import React from 'react';
import { XMarkIcon, ArrowPathIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

interface ChatHeaderProps {
  onReset: () => void;
  onToggleExpand: () => void;
  onClose: () => void;
  expandedView: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onReset, onToggleExpand, onClose, expandedView }) => {
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white">Prévisualisation du Chatbot</h2>
      <div className="flex space-x-2">
        <button
          onClick={onToggleExpand}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title={expandedView ? 'Réduire le panel' : 'Élargir le panel'}
        >
          {expandedView ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
        </button>
        <button
          onClick={onReset}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Recommencer la conversation"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Fermer"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;