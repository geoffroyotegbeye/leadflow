import React from 'react';
import { Menu } from '@headlessui/react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onEdit, onDelete }) => {
  return (
    <div
      className="fixed z-50"
      style={{
        top: y,
        left: x,
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 w-48">
        <div className="py-1">
          <button
            onClick={onEdit}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <PencilIcon className="mr-3 h-5 w-5 text-gray-400" />
            Éditer
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <TrashIcon className="mr-3 h-5 w-5 text-red-400" />
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContextMenu;
