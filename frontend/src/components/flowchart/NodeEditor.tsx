import React, { Fragment, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, TrashIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import './NodeEditor.css';
import * as HeroIcons from '@heroicons/react/24/outline';
import { NodeData, ElementType, ELEMENT_TYPES, NODE_TYPES } from './NodeTypes';
import ElementPicker from './ElementPicker';

interface NodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  node: NodeData | null;
  onSave: (data: NodeData) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({
  isOpen,
  onClose,
  node,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  const [formData, setFormData] = React.useState<NodeData | null>(null);
  const [isElementPickerOpen, setIsElementPickerOpen] = React.useState(false);
  const [selectedIcon, setSelectedIcon] = React.useState<string>('');

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

      case 'input':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={element.content}
              onChange={(e) => handleElementChange(element.id, { content: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Texte de la question à poser (ex: Entrez votre email)"
            />
            <select
              value={element.inputType || 'text'}
              onChange={e => handleElementChange(element.id, { inputType: e.target.value as 'text' | 'email' | 'number' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="text">Texte libre</option>
              <option value="email">Email</option>
              <option value="number">Numéro</option>
            </select>
          </div>
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
                  <Fragment key={optionIndex}>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...(element.options || [])];
                          newOptions[optionIndex] = {
                            ...newOptions[optionIndex],
                            text: e.target.value
                          };
                          handleElementChange(element.id, { options: newOptions });
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Supprimer cette option"
                      >
                        <XMarkIcon className="h-5 w-5 dark:text-white" />
                      </button>
                    </div>
                  </Fragment>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = [...(element.options || []), {
                      id: `option-${Date.now()}`,
                      text: ''
                    }];
                    handleElementChange(element.id, { options: newOptions });
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <PlusIcon className="h-4 w-4 mr-1 dark:text-white" />
                  <span className="dark:text-white">Ajouter une option</span>
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
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 max-h-[90vh] flex flex-col border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                Éditer le nœud
              </Dialog.Title>
              <div className="flex space-x-2">
                {onDuplicate && (
                  <button
                    onClick={onDuplicate}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Dupliquer le nœud"
                  >
                    <DocumentDuplicateIcon className="h-6 w-6 dark:text-white" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6 dark:text-white" />
                </button>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (formData) onSave(formData);
              onClose();
            }}>
              <div className="space-y-4 node-editor-content">
                {/* Configuration du nœud */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Configuration du nœud
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Nom du nœud
                      </label>
                      <input
                        type="text"
                        value={formData?.label || ''}
                        onChange={(e) =>
                          setFormData(prev => prev ? { ...prev, label: e.target.value } : null)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>



                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Couleur du nœud
                      </label>
                      <div className="mt-2 color-selector-container">
                        <div className="color-presets flex flex-wrap gap-2 mb-2">
                          {[
                            '#3B82F6', // Bleu
                            '#10B981', // Vert
                            '#F59E0B', // Jaune
                            '#EF4444', // Rouge
                            '#8B5CF6', // Violet
                            '#EC4899', // Rose
                            '#6B7280', // Gris
                            '#000000'  // Noir
                          ].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setFormData(prev => prev ? { ...prev, color } : null)}
                              className={`color-preset w-8 h-8 rounded-full border-2 ${formData?.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-200 dark:border-gray-700'}`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="custom-color-input flex items-center">
                          <div 
                            className="color-preview w-8 h-8 rounded-full mr-2 border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: formData?.color || '#3B82F6' }}
                          />
                          <input
                            type="color"
                            value={formData?.color || '#3B82F6'}
                            onChange={(e) => setFormData(prev => prev ? { ...prev, color: e.target.value } : null)}
                            className="color-input w-full h-10 cursor-pointer"
                            title="Choisir une couleur personnalisée"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section des éléments */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Éléments ({formData?.elements?.length || 0})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsElementPickerOpen(true)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    >
                      <PlusIcon className="h-4 w-4 mr-1 dark:text-white" />
                      <span className="dark:text-white">Ajouter un élément</span>
                    </button>
                  </div>

                  {formData?.elements.map((element, index) => (
                    <div key={element.id} className="element-card">
                      <div className="element-card-header">
                        <span className="element-badge">{index + 1}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2 mr-auto">
                          {ELEMENT_TYPES[element.type]?.label || element.type}
                        </span>
                        <div className="element-actions ml-2">
                          <select
                            value={element.displayMode}
                            onChange={(e) =>
                              handleElementChange(element.id, {
                                displayMode: e.target.value as 'after' | 'simultaneous'
                              })
                            }
                            className="text-xs rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="after">Après</option>
                            <option value="simultaneous">Simultané</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (index > 0 && formData) {
                                const newElements = [...formData.elements];
                                [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
                                setFormData({ ...formData, elements: newElements });
                              }
                            }}
                            disabled={index === 0}
                            className={`p-1 rounded-md ${index === 0 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                            title="Monter"
                          >
                            <ChevronUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (formData && index < formData.elements.length - 1) {
                                const newElements = [...formData.elements];
                                [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
                                setFormData({ ...formData, elements: newElements });
                              }
                            }}
                            disabled={formData ? index === formData.elements.length - 1 : true}
                            className={`p-1 rounded-md ${formData && index === formData.elements.length - 1 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                            title="Descendre"
                          >
                            <ChevronDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (formData) {
                                const newElement = { ...element, id: crypto.randomUUID() };
                                const newElements = [...formData.elements];
                                newElements.splice(index + 1, 0, newElement);
                                setFormData({ ...formData, elements: newElements });
                              }
                            }}
                            className="p-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="Dupliquer"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteElement(element.id)}
                            className="p-1 rounded-md text-red-600 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-red-400"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="element-card-content">
                        {renderElementContent(element)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse border-t dark:border-gray-700 pt-4 sticky bottom-0 bg-white dark:bg-gray-800 z-10">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 dark:bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 dark:hover:bg-blue-800 sm:ml-3 sm:w-auto"
                    onClick={() => {
                      if (formData) {
                        onSave(formData);
                        onClose();
                      }
                    }}
                  >
                    <span className="dark:text-white">Enregistrer</span>
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    <span className="dark:text-white">Annuler</span>
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-red-600 dark:bg-red-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 dark:hover:bg-red-800 sm:mt-0 sm:w-auto"
                      onClick={() => {
                        onDelete();
                        onClose();
                      }}
                    >
                      <span className="dark:text-white">Supprimer</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
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
