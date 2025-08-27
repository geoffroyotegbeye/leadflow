import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatMessage } from './types';

interface MessageListProps {
  children: React.ReactNode;
  messages: ChatMessage[];
}

const MessageList: React.FC<MessageListProps> = ({ children, messages }) => {
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Aucun message</p>
          </div>
        ) : (
          children
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;