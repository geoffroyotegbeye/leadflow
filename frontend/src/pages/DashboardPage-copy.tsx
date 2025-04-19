import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AssistantForm from '../components/dashboard/AssistantForm';
import AssistantCard from '../components/dashboard/AssistantCard';
import { motion } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const stats = [
  {
    name: 'Chatbots Actifs',
    value: '12',
    change: '+2',
    icon: ChatBubbleLeftRightIcon,
    color: 'blue',
  },
  {
    name: 'Leads Générés',
    value: '2,847',
    change: '+18%',
    icon: UserGroupIcon,
    color: 'purple',
  },
  {
    name: 'Taux de Conversion',
    value: '24.3%',
    change: '+2.4%',
    icon: ChartBarIcon,
    color: 'green',
  },
  {
    name: 'Conversations',
    value: '14,281',
    change: '+15%',
    icon: ArrowTrendingUpIcon,
    color: 'orange',
  },
];

const LOCAL_STORAGE_KEY = 'LeadCX:assistants';

const DashboardPage: React.FC = () => {
  const [assistants, setAssistants] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Filtrer les assistants selon le terme de recherche
  const filteredAssistants = assistants.filter(assistant => 
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    assistant.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Charger la liste depuis le localStorage
  useEffect(() => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      try {
        setAssistants(JSON.parse(data));
      } catch {}
    }
  }, []);

  // Ajouter un nouvel assistant
  const handleCreate = (assistant: { id: string; name: string; description: string }) => {
    const updated = [...assistants, assistant];
    setAssistants(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // Supprimer un assistant
  const handleDelete = (id: string) => {
    const updated = assistants.filter(a => a.id !== id);
    setAssistants(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // Dupliquer un assistant
  const handleDuplicate = (id: string) => {
    const assistant = assistants.find(a => a.id === id);
    if (!assistant) return;
    const newAssistant = {
      ...assistant,
      id: crypto.randomUUID(),
      name: assistant.name + ' (Copie)'
    };
    const updated = [...assistants, newAssistant];
    setAssistants(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // Renommer un assistant
  const handleRename = (id: string, newName: string) => {
    const updated = assistants.map(assistant => 
      assistant.id === id ? { ...assistant, name: newName } : assistant
    );
    setAssistants(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };
  return (
    <div className="space-y-8 px-6 py-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-600">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
          >
            <SparklesIcon className="h-8 w-8 text-blue-500" />
            Bienvenue sur LeadCX
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 dark:text-gray-300 mt-2"
          >
            Créez et gérez vos chatbots intelligents pour générer plus de leads
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center gap-2 font-medium"
          onClick={() => setShowForm(true)}
        >
          <PlusIcon className="h-5 w-5" />
          Nouveau Chatbot
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                <stat.icon
                  className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Assistants */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mes assistants</h2>
          
          {/* Barre de recherche */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Rechercher un assistant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {showForm ? (
          <AssistantForm
            onCreate={handleCreate}
            onClose={() => setShowForm(false)}
          />
        ) : null}

        {assistants.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
            <p className="mb-2">Aucun assistant pour l'instant.</p>
            <button 
              onClick={() => setShowForm(true)}
              className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" /> Créer votre premier assistant
            </button>
          </div>
        ) : filteredAssistants.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
            Aucun résultat pour <span className="font-medium">"{searchTerm}"</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssistants.map(assistant => (
              <AssistantCard
                key={assistant.id}
                id={assistant.id}
                name={assistant.name}
                description={assistant.description}
                onEdit={() => navigate(`/chatbots/editor/${assistant.id}`)}
                onDelete={() => handleDelete(assistant.id)}
                onDuplicate={() => handleDuplicate(assistant.id)}
                onRename={handleRename}
              />
            ))}
          </div>
        )}
        
        {/* Pagination (placeholder pour l'avenir) */}
        {filteredAssistants.length > 0 && (
          <div className="mt-8 flex justify-center">
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/30 text-sm font-medium text-blue-600 dark:text-blue-300">
                1
              </button>
              <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
