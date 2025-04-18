import React, { Fragment } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { NodeData, ElementType, ELEMENT_TYPES } from './NodeTypes';
import ElementPicker from './ElementPicker';

interface NodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  node: NodeData | null;
  onSave: (data: NodeData) => void;
  onDelete?: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({
  isOpen,
  onClose,
  node,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = React.useState<NodeData | null>(null);
  const [isElementPickerOpen, setIsElementPickerOpen] = React.useState(false);

  React.useEffect(() => {
    if (node) {
      setFormData({
        ...node,
        elements: node.elements || []
      });
    }
  }, [node]);

  const handleAddElement = (element: ElementType) => {
    if (formData) {
      setFormData({
        ...formData,
        elements: [...formData.elements, element]
      });
    }
  };

  const handleElementChange = (elementId: string, updates: Partial<ElementType>) => {
    if (formData) {
      setFormData({
        ...formData,
        elements: formData.elements.map(element =>
          element.id === elementId ? { ...element, ...updates } : element
        )
      });
    }
  };

  const handleDeleteElement = (elementId: string) => {
    if (formData) {
      setFormData({
        ...formData,
        elements: formData.elements.filter(element => element.id !== elementId)
      });
    }
  };

  const renderElementContent = (element: ElementType) => {
    switch (element.type) {
      case 'text':
        return (
          <textarea
            value={element.content}
            onChange={(e) =>
              handleElementChange(element.id, { content: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={2}
            placeholder="Entrez votre message..."
          />
        );

      case 'question':
        return (
          <div className="space-y-2">
            <textarea
              value={element.content}
              onChange={(e) =>
                handleElementChange(element.id, { content: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={2}
              placeholder="Posez votre question..."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Options de réponse
              </label>
              <div className="mt-1 space-y-2">
                {(element.options || []).map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(element.options || [])];
                        newOptions[optionIndex] = e.target.value;
                        handleElementChange(element.id, { options: newOptions });
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = (element.options || []).filter(
                          (_, i) => i !== optionIndex
                        );
                        handleElementChange(element.id, { options: newOptions });
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = [...(element.options || []), ''];
                    handleElementChange(element.id, { options: newOptions });
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Ajouter une option
                </button>
              </div>
            </div>
          </div>
        );

      case 'api_call':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={element.apiConfig?.url || ''}
              onChange={(e) =>
                handleElementChange(element.id, {
                  apiConfig: { ...element.apiConfig, url: e.target.value }
                })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="URL de l'API"
            />
            <select
              value={element.apiConfig?.method || 'GET'}
              onChange={(e) =>
                handleElementChange(element.id, {
                  apiConfig: { ...element.apiConfig, method: e.target.value }
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        );

      case 'wait_input':
        return (
          <input
            type="text"
            value={element.content}
            onChange={(e) =>
              handleElementChange(element.id, { content: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Message d'attente de réponse..."
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl shadow-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-medium">
                  Éditer le nœud
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (formData) onSave(formData);
                onClose();
              }}>
                <div className="space-y-4">
                  {/* Label */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nom du nœud
                    </label>
                    <input
                      type="text"
                      value={formData?.label || ''}
                      onChange={(e) =>
                        setFormData(prev => prev ? { ...prev, label: e.target.value } : null)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Elements */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-700">Éléments</h3>
                      <button
                        type="button"
                        onClick={() => setIsElementPickerOpen(true)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Ajouter un élément
                      </button>
                    </div>

                    {formData?.elements.map((element, index) => (
                      <div key={element.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-500">
                              {ELEMENT_TYPES[element.type].label}
                            </span>
                            <select
                              value={element.displayMode}
                              onChange={(e) =>
                                handleElementChange(element.id, {
                                  displayMode: e.target.value as 'after' | 'simultaneous'
                                })
                              }
                              className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="after">Après le précédent</option>
                              <option value="simultaneous">En même temps</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteElement(element.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>

                        {renderElementContent(element)}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    {onDelete && (
                      <button
                        type="button"
                        onClick={onDelete}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Supprimer
                      </button>
                    )}
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <ElementPicker
        isOpen={isElementPickerOpen}
        onClose={() => setIsElementPickerOpen(false)}
        onSelect={handleAddElement}
      />
    </>
  );
};

export default NodeEditor;
