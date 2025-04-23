import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import AssistantService from '../../services/api';

interface AssistantSelectorProps {
  selectedAssistantId?: string;
  onAssistantChange: (assistantId: string) => void;
}

interface AssistantOption {
  id: string;
  name: string;
}

const AssistantSelector: React.FC<AssistantSelectorProps> = ({ 
  selectedAssistantId,
  onAssistantChange
}) => {
  const [assistants, setAssistants] = useState<AssistantOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  // Charger la liste des assistants
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setLoading(true);
        console.log('🔍 Récupération de la liste des assistants...');
        
        const data = await AssistantService.getAll();
        console.log('👤 Assistants récupérés:', data.length, 'assistants trouvés');
        
        // Transformer les données pour le sélecteur
        const options = data.map(assistant => ({
          id: assistant.id || '',
          name: assistant.name
        }));
        
        console.log('🔄 Options formatées pour le sélecteur:', options);
        setAssistants(options);
        setError(null);
      } catch (err) {
        console.error('❌ Erreur lors de la récupération des assistants:', err);
        setError('Impossible de charger la liste des assistants');
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, []);

  // Gérer la sélection d'un assistant
  const handleAssistantSelect = (assistantId: string) => {
    console.log('✅ Assistant sélectionné:', assistantId);
    onAssistantChange(assistantId);
    setIsOpen(false);
  };

  // Rediriger vers la page des chatbots pour en créer un nouveau
  const handleCreateNew = () => {
    navigate('/dashboard/chatbots');
  };

  // Trouver le nom de l'assistant sélectionné
  const selectedAssistantName = selectedAssistantId 
    ? assistants.find(a => a.id === selectedAssistantId)?.name || 'Assistant sélectionné'
    : 'Sélectionner un assistant';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
        <span className="text-gray-700 dark:text-gray-200">
          {loading ? 'Chargement...' : selectedAssistantName}
        </span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Chargement des assistants...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : assistants.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">Aucun assistant disponible</p>
              <button 
                onClick={handleCreateNew}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Créer un assistant
              </button>
            </div>
          ) : (
            <ul className="py-1 max-h-60 overflow-y-auto">
              {assistants.map(assistant => (
                <li key={assistant.id}>
                  <button
                    onClick={() => handleAssistantSelect(assistant.id)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedAssistantId === assistant.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {assistant.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AssistantSelector;
