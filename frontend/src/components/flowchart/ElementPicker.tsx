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
  EnvelopeIcon,
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
  const [showInputTypeModal, setShowInputTypeModal] = React.useState(false);
  const [pendingInputType, setPendingInputType] = React.useState<ElementType['inputType']>('text');

  const handleSelectElement = (type: ElementType['type']) => {
    if (type === 'input') {
      setShowInputTypeModal(true);
      return;
    }
    const newElement: ElementType = {
      id: crypto.randomUUID(),
      type,
      content: '',
      displayMode: 'after'
    };
    onSelect(newElement);
    onClose();
  };

  const handleInputTypeSelect = (inputType: ElementType['inputType']) => {
    const newElement: ElementType = {
      id: crypto.randomUUID(),
      type: 'input',
      content: '',
      displayMode: 'after',
      inputType,
    };
    onSelect(newElement);
    setShowInputTypeModal(false);
    onClose();
  };

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

            {/* Modal pour choisir le type d'entrée libre */}
            {showInputTypeModal ? (
              <div className="flex flex-col gap-4 items-center justify-center p-6">
                <span className="text-base font-medium text-gray-900 dark:text-white mb-2">Type d'entrée à demander :</span>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => handleInputTypeSelect('text')}
                  >Texte libre</button>
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => handleInputTypeSelect('email')}
                  >Email</button>
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => handleInputTypeSelect('number')}
                  >Numéro</button>
                </div>
                <button
                  className="mt-6 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline"
                  onClick={() => setShowInputTypeModal(false)}
                >Annuler</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh]">
                {Object.entries(ELEMENT_TYPES)
                  .filter(([type]) => ['text', 'question', 'input'].includes(type))
                  .map(([type, info]) => {
                    // Suppression des icônes comme demandé
                    return (
                      <button
                        key={type}
                        onClick={() => handleSelectElement(type as ElementType['type'])}
                        className="flex flex-col items-center p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                      >
                        <div className="p-3 rounded-lg mb-2 bg-blue-50 dark:bg-blue-900/30">
                          <span className="text-sm font-medium">{info.label}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                          {info.description}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}

          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ElementPicker;
