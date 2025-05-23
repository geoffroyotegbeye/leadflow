import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  PlayIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  GlobeAltIcon,
  ClockIcon,
  StopIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  CircleStackIcon,
  ArrowsRightLeftIcon,
  ArrowPathRoundedSquareIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { ElementType, ELEMENT_TYPES, NodeType, NODE_TYPES } from './NodeTypes';

interface ElementPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (element: ElementType) => void;
}

export const ElementPicker: React.FC<ElementPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  // État supprimé pour l'entrée libre

const handleSelectElement = (type: ElementType['type']) => {
  // Créer un nouvel élément pour tous les types, y compris 'image'
  const newElement: ElementType = {
    id: crypto.randomUUID(),
    type,
    content: '',
    displayMode: 'after'
  };
  onSelect(newElement);
  onClose();
};

  // Fonction supprimée pour la sélection du type d'entrée

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                Choisir un élément
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
              >
                <XMarkIcon className="h-6 w-6 dark:text-white" />
              </button>
            </div>

            {/* Boutons pour chaque type d'élément */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                className="flex flex-col items-center px-4 py-3 rounded bg-blue-50 hover:bg-blue-100 dark:bg-gray-900 dark:hover:bg-gray-700 transition"
                onClick={() => handleSelectElement('text')}
              >
                <ChatBubbleLeftRightIcon className="h-7 w-7 mb-1 text-blue-500" />
                <span className="text-xs font-medium">Message</span>
                <span className="text-[11px] text-gray-500 mt-1">Envoyer une information</span>
              </button>
              <button
                className="flex flex-col items-center px-4 py-3 rounded bg-blue-50 hover:bg-blue-100 dark:bg-gray-900 dark:hover:bg-gray-700 transition"
                onClick={() => handleSelectElement('question')}
              >
                <QuestionMarkCircleIcon className="h-7 w-7 mb-1 text-green-500" />
                <span className="text-xs font-medium">Question</span>
                <span className="text-[11px] text-gray-500 mt-1">Choix parmi des options</span>
              </button>
              {/* Élément d'entrée libre supprimé */}
              <button
                className="flex flex-col items-center px-4 py-3 rounded bg-blue-50 hover:bg-blue-100 dark:bg-gray-900 dark:hover:bg-gray-700 transition"
                onClick={() => handleSelectElement('form')}
              >
                <AdjustmentsHorizontalIcon className="h-7 w-7 mb-1 text-purple-500" />
                <span className="text-xs font-medium">Formulaire</span>
                <span className="text-[11px] text-gray-500 mt-1">Plusieurs champs à remplir</span>
              </button>
              <button
                className="flex flex-col items-center px-4 py-3 rounded bg-blue-50 hover:bg-blue-100 dark:bg-gray-900 dark:hover:bg-gray-700 transition"
                onClick={() => handleSelectElement('image')}
              >
                <DevicePhoneMobileIcon className="h-7 w-7 mb-1 text-pink-500" />
                <span className="text-xs font-medium">Image</span>
                <span className="text-[11px] text-gray-500 mt-1">Afficher une image</span>
              </button>
              
            </div>

            {/* Modal pour choisir le type d'entrée libre supprimé */}

          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ElementPicker;
