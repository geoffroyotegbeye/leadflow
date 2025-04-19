import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import GlassCard from '../GlassCard';
import { motion } from 'framer-motion';

interface AssistantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assistant: { name: string; description: string; color?: string }) => void;
}

const AssistantForm: React.FC<AssistantFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Appeler la fonction onSubmit avec les données de l'assistant
      await onSubmit({
        name: name.trim(),
        description: description.trim(),

      });
      
      // Réinitialiser le formulaire
      setName('');
      setDescription('');
      setError('');
      
      // Fermer le formulaire
      onClose();
    } catch (err) {
      setError('Une erreur est survenue lors de la création de l\'assistant.');
      console.error('Erreur lors de la création de l\'assistant:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <GlassCard>
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Créer un Assistant
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-center text-sm text-gray-600 dark:text-gray-300"
          >
            Configure ton assistant IA pour automatiser tes conversations.
          </motion.p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
                Nom de l’assistant <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white dark:bg-gray-800"
                placeholder="Ex: Assistant RH"
                required
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none bg-white dark:bg-gray-800"
                placeholder="Décris le rôle de ton assistant (optionnel)"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 rounded-lg shadow transition-colors duration-200 flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              ) : null}
              Créer l’assistant
            </button>
          </form>
        </GlassCard>
      </div>
    </Dialog>
  );
};

export default AssistantForm;
