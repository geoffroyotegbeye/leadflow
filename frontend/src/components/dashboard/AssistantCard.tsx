import React, { useState, useRef, useEffect } from 'react';
import { PencilIcon, TrashIcon, DocumentDuplicateIcon, ChatBubbleLeftRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useToast } from '../ui/ToastContainer';

interface AssistantCardProps {
  id: string;
  name: string;
  description: string;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename?: (id: string, newName: string) => void;
  onUpdateDescription?: (id: string, newDescription: string) => void;
}

const AssistantCard: React.FC<AssistantCardProps> = ({ 
  id, 
  name, 
  description, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onRename = () => {},
  onUpdateDescription = () => {}
 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedDescription, setEditedDescription] = useState(description);
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  // Focus l'input quand on passe en mode édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Mettre à jour editedName et editedDescription quand les props changent
  useEffect(() => {
    setEditedName(name);
    setEditedDescription(description);
  }, [name, description]);
  
  // Focus l'input de description quand on passe en mode édition de description
  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);

  // Gérer la sauvegarde du nom
  const handleSave = () => {
    if (editedName.trim() === '') {
      setEditedName(name); // Revenir au nom original si vide
    } else if (editedName !== name) {
      onRename(id, editedName.trim());
    }
    setIsEditing(false);
  };
  
  // Gérer la sauvegarde de la description
  const handleSaveDescription = () => {
    if (editedDescription.trim() === '') {
      setEditedDescription(description); // Revenir à la description originale si vide
    } else if (editedDescription !== description) {
      onUpdateDescription(id, editedDescription.trim());
    }
    setIsEditingDescription(false);
  };

  // Gérer les touches clavier pour le nom
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedName(name);
      setIsEditing(false);
    }
  };
  
  // Gérer les touches clavier pour la description
  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditedDescription(description);
      setIsEditingDescription(false);
    }
    // Note: Pas de gestion de Enter car on veut permettre les sauts de ligne
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full group hover:border-blue-200 dark:hover:border-blue-800">
      <div>
        <div className="flex items-center mb-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-3">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          {isEditing ? (
            <div className="flex-1 flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="flex-1 text-lg font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
              <button 
                onClick={handleSave}
                className="ml-2 p-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3 
              className="text-lg font-bold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onDoubleClick={() => setIsEditing(true)}
              title="Double-cliquez pour modifier"
            >
              {name}
            </h3>
          )}
        </div>
        {isEditingDescription ? (
          <div className="mb-6">
            <textarea
              ref={descriptionInputRef}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={handleSaveDescription}
              onKeyDown={handleDescriptionKeyDown}
              className="w-full text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              maxLength={200}
              placeholder="Description de l'assistant..."
            />
            <div className="flex justify-end mt-2">
              <button 
                onClick={handleSaveDescription}
                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-800/30"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="text-sm text-gray-600 dark:text-gray-300 mb-6 min-h-[40px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 p-1 rounded"
            onDoubleClick={() => setIsEditingDescription(true)}
            title="Double-cliquez pour modifier la description"
          >
            {description || <span className="italic text-gray-400">Ajouter une description...</span>}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onEdit}
          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition text-sm font-medium"
        >
          <PencilIcon className="w-4 h-4" /> Éditer
        </button>
        <button
          onClick={onDuplicate}
          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-sm font-medium"
        >
          <DocumentDuplicateIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Dupliquer</span>
          <span className="sm:hidden">Copier</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition text-sm font-medium"
        >
          <TrashIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Supprimer</span>
          <span className="sm:hidden">Supp.</span>
        </button>
      </div>
    </div>
  );
};

export default AssistantCard;
