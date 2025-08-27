import React, { forwardRef } from 'react';

interface ChatWindowProps {
  children: React.ReactNode;
  isLoading: boolean;
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(({ children, isLoading }, ref) => {
  return (
    <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-800">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-500 dark:text-gray-400">Chargement...</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;