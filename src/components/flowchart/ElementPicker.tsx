import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ElementType, ELEMENT_TYPES } from './NodeTypes';

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
  const handleSelectElement = (type: ElementType['type']) => {
    const newElement: ElementType = {
      id: crypto.randomUUID(),
      type,
      content: '',
      displayMode: 'after'
    };
    onSelect(newElement);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium">
                Choisir un élément
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(ELEMENT_TYPES).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => handleSelectElement(type as ElementType['type'])}
                  className="w-full p-4 text-left hover:bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <h3 className="font-medium text-gray-900">{info.label}</h3>
                  <p className="text-sm text-gray-500">{info.description}</p>
                </button>
              ))}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ElementPicker;
