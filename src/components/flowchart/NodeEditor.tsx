import React, { Fragment } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { NodeData, NodeType, NODE_TYPES } from './NodeTypes';

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

  React.useEffect(() => {
    if (node) {
      setFormData({ ...node });
    }
  }, [node]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  const renderFields = () => {
    if (!formData) return null;

    switch (formData.type) {
      case NodeType.MESSAGE:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message
              </label>
              <textarea
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={formData.content || ''}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>
          </div>
        );

      case NodeType.QUESTION:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Question
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={formData.content || ''}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Options (une par ligne)
              </label>
              <textarea
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={formData.options?.join('\n') || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    options: e.target.value.split('\n').filter(Boolean),
                  })
                }
              />
            </div>
          </div>
        );

      case NodeType.CONDITION:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Variable
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={formData.content || ''}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>
          </div>
        );

      case NodeType.ACTION:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type d'action
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={formData.metadata?.actionType || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, actionType: e.target.value },
                  })
                }
              >
                <option value="save_variable">Sauvegarder variable</option>
                <option value="send_email">Envoyer email</option>
                <option value="webhook">Webhook</option>
                <option value="custom">Action personnalisée</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog as="div" open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl">
          <div className="absolute right-4 top-4">
            <button
              type="button"
              className="rounded-md text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            {node ? `Éditer ${NODE_TYPES[node.type].label}` : 'Nouveau nœud'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  value={formData?.label || ''}
                  onChange={(e) =>
                    formData && setFormData({ ...formData, label: e.target.value })
                  }
                />
              </div>

              {renderFields()}

              <div className="mt-6 flex justify-between">
                {onDelete && (
                  <button
                    type="button"
                    className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={onDelete}
                  >
                    <TrashIcon className="h-5 w-5 inline-block mr-2" />
                    Supprimer
                  </button>
                )}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default NodeEditor;
