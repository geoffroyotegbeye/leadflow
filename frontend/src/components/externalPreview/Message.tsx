import React from 'react';
import { motion } from 'framer-motion';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { ChatMessage } from './types';
import InlineInputField from './InlineInputField';

interface MessageProps {
  message: ChatMessage;
  isFirstBotMessageInGroup: boolean;
  onOptionClick: (optionText: string, elementData: any) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentNodeId: string | null;
  setCurrentNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  flowData: { nodes: any[]; edges: any[] };
  processNodeElements: (node: any) => void;
}

const Message: React.FC<MessageProps> = ({
  message,
  isFirstBotMessageInGroup,
  onOptionClick,
  setMessages,
  currentNodeId,
  setCurrentNodeId,
  flowData,
  processNodeElements,
}) => {
  return (
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
        {message.sender === 'bot' && isFirstBotMessageInGroup && (
          <div className="flex items-center mb-1">
            <UserCircleIcon className="h-5 w-5 mr-1 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Bot</span>
          </div>
        )}
        {message.isTyping ? (
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-[bounce_1.4s_infinite]"></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-[bounce_1.4s_infinite_0.2s]"></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-[bounce_1.4s_infinite_0.4s]"></span>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="text-sm">
            {message.type === 'form' && message.content ? (
              <div className="space-y-1">
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
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                <img
                  src={message.elementData.mediaUrl}
                  alt={message.content || 'Image'}
                  className="max-w-full rounded-t-lg max-h-64 object-contain mx-auto p-2"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                  }}
                />
                {message.content && (
                  <p className="p-3 text-sm border-t border-gray-100 dark:border-gray-700">{message.content}</p>
                )}
              </div>
            ) : message.type === 'video' && message.elementData?.mediaUrl ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                <video
                  src={message.elementData.mediaUrl}
                  controls
                  className="max-w-full rounded-t-lg max-h-64 mx-auto p-2"
                />
                {message.content && (
                  <p className="p-3 text-sm border-t border-gray-100 dark:border-gray-700">{message.content}</p>
                )}
              </div>
            ) : message.type === 'audio' && message.elementData?.mediaUrl ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm p-3">
                <audio src={message.elementData.mediaUrl} controls className="w-full" />
                {message.content && <p className="mt-2 text-sm">{message.content}</p>}
              </div>
            ) : message.type === 'file' && message.elementData?.fileUrl ? (
              <div>
                <a
                  href={message.elementData.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg my-2 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  {message.content || 'Télécharger le fichier'}
                </a>
              </div>
            ) : (
              <p>{message.content}</p>
            )}
            {message.sender === 'bot' && !message.isTyping && message.elementData?.options?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-2 space-y-1"
              >
                <div className="grid grid-cols-2 gap-2 py-2">
                  {message.elementData.options.map((option: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => onOptionClick(option.text, message.elementData)}
                      className="flex flex-col items-center justify-center px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors w-full text-xs text-gray-700 dark:text-gray-200 text-center break-words"
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
                      {option.text && <span>{option.text}</span>}
                    </button>
                  ))}
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
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Message;