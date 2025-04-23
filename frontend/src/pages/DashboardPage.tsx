import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AssistantForm from '../components/dashboard/AssistantForm';
import AssistantCard from '../components/dashboard/AssistantCard';
import DashboardStatsCharts from '../components/dashboard/DashboardStatsCharts';
import DashboardRecentActivity from '../components/dashboard/DashboardRecentActivity';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/ToastContainer';
import { motion } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import AssistantService, { Assistant } from '../services/api';

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

const DashboardPage: React.FC = () => {
  const [assistants, setAssistants] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Filtrer les assistants selon le terme de recherche
  const filteredAssistants = assistants.filter(assistant => 
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (assistant.description && assistant.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Charger la liste des assistants depuis l'API
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await AssistantService.getAll();
        // Mapping pour garantir id et name
        setAssistants(
          data.map((a: any) => ({
            ...a,
            id: a.id || a._id, // supporte MongoDB
            name: a.name || a.title || "Sans nom", 
            description: a.description || ""
          }))
        );
      } catch (err) {
        console.error('Erreur lors du chargement des assistants:', err);
        setError('Impossible de charger les assistants. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchAssistants();
  }, []);

  // Ajouter un nouvel assistant
  const handleCreate = async (assistant: { name: string; description: string }) => {
    try {
      setError(null);
      // Créer un nouvel assistant avec des nodes et edges vides
      const newAssistant: Assistant = {
        ...assistant,
        nodes: [],
        edges: []
      };
      
      // Envoyer à l'API
      const createdAssistant = await AssistantService.create(newAssistant);
      
      // Mettre à jour l'état local avec le bon typage
      setAssistants(prev => [...prev, {
        id: createdAssistant.id || '',
        name: createdAssistant.name,
        description: createdAssistant.description || ''
      }]);
      
      showToast({ 
        type: 'success', 
        message: `Assistant "${createdAssistant.name}" créé avec succès` 
      });
      
      // Rediriger vers l'éditeur du nouvel assistant
      // navigate(`/chatbots/editor/${createdAssistant.id}`);
      
      return createdAssistant;
    } catch (err) {
      console.error('Erreur lors de la création de l\'assistant:', err);
      showToast({ 
        type: 'error', 
        message: 'Impossible de créer l\'assistant. Veuillez réessayer plus tard.' 
      });
      throw new Error('Impossible de créer l\'assistant. Veuillez réessayer plus tard.');
    }
  };

  // Supprimer un assistant
  const handleDelete = async (id: string) => {
    // Ouvrir la boîte de dialogue de confirmation
    const assistant = assistants.find(a => a.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer l\'assistant',
      message: `Êtes-vous sûr de vouloir supprimer l'assistant "${assistant?.name || 'Sans nom'}" ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          setError(null);
          await AssistantService.delete(id);
          setAssistants(prev => prev.filter(assistant => assistant.id !== id));
          showToast({ 
            type: 'success', 
            message: 'Assistant supprimé avec succès' 
          });
        } catch (err) {
          console.error('Erreur lors de la suppression de l\'assistant:', err);
          showToast({ 
            type: 'error', 
            message: 'Impossible de supprimer l\'assistant. Veuillez réessayer plus tard.' 
          });
        } finally {
          // Fermer la boîte de dialogue
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Dupliquer un assistant
  const handleDuplicate = async (id: string) => {
    try {
      setError(null);
      const assistant = await AssistantService.getById(id);
      
      // Créer une copie avec un nouveau nom
      const duplicatedAssistant = {
        ...assistant,
        name: `${assistant.name} (Copie)`,
        id: undefined // L'API générera un nouvel ID
      };
      
      // Envoyer à l'API
      const createdAssistant = await AssistantService.create(duplicatedAssistant);
      
      // Mettre à jour l'état local avec le bon typage
      setAssistants(prev => [...prev, {
        id: createdAssistant.id || '',
        name: createdAssistant.name,
        description: createdAssistant.description || ''
      }]);
      
      showToast({ 
        type: 'success', 
        message: `Assistant "${assistant.name}" dupliqué avec succès` 
      });
    } catch (err) {
      console.error('Erreur lors de la duplication de l\'assistant:', err);
      showToast({ 
        type: 'error', 
        message: 'Impossible de dupliquer l\'assistant. Veuillez réessayer plus tard.' 
      });
    }
  };

  // Renommer un assistant
  const handleRename = async (id: string, newName: string) => {
    try {
      setError(null);
      // Mettre à jour dans l'API
      await AssistantService.update(id, { name: newName });
      
      // Mettre à jour l'état local
      setAssistants(prev => 
        prev.map(assistant => 
          assistant.id === id ? { ...assistant, name: newName } : assistant
        )
      );
      
      showToast({ 
        type: 'success', 
        message: 'Nom mis à jour avec succès' 
      });
    } catch (err) {
      console.error('Erreur lors du renommage de l\'assistant:', err);
      showToast({ 
        type: 'error', 
        message: 'Impossible de renommer l\'assistant. Veuillez réessayer plus tard.' 
      });
    }
  };
  
  // Mettre à jour la description d'un assistant
  const handleUpdateDescription = async (id: string, newDescription: string) => {
    try {
      setError(null);
      // Mettre à jour dans l'API
      await AssistantService.update(id, { description: newDescription });
      
      // Mettre à jour l'état local
      setAssistants(prev => 
        prev.map(assistant => 
          assistant.id === id ? { ...assistant, description: newDescription } : assistant
        )
      );
      
      showToast({ 
        type: 'success', 
        message: 'Description mise à jour avec succès' 
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la description:', err);
      showToast({ 
        type: 'error', 
        message: 'Impossible de mettre à jour la description. Veuillez réessayer plus tard.' 
      });
    }
  };

  // Importer un assistant depuis un fichier JSON
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportLoading(true);
      setError(null);

      // Lire le fichier JSON
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          
          // Envoyer les données à l'API
          const importedAssistant = await AssistantService.importFromJson(jsonData);
          
          // Mettre à jour l'état local
          setAssistants(prev => [...prev, importedAssistant]);
          
          // Réinitialiser l'input file
          if (event.target) event.target.value = '';
          
          showToast({ 
            type: 'success', 
            message: `Assistant "${importedAssistant.name}" importé avec succès` 
          });
        } catch (err) {
          console.error('Erreur lors de l\'importation du JSON:', err);
          showToast({ 
            type: 'error', 
            message: 'Le fichier JSON sélectionné n\'est pas valide ou ne contient pas les données requises.' 
          });
        } finally {
          setImportLoading(false);
        }
      };
      
      reader.onerror = () => {
        showToast({ 
          type: 'error', 
          message: 'Erreur lors de la lecture du fichier.' 
        });
        setImportLoading(false);
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error('Erreur lors de l\'importation de l\'assistant:', err);
      showToast({ 
        type: 'error', 
        message: 'Impossible d\'importer l\'assistant. Veuillez réessayer plus tard.' 
      });
      setImportLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Boîte de dialogue de confirmation */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        type="danger"
      />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Gérez vos assistants conversationnels</p>
        </div>
        <div className="flex space-x-3">
          {/* Bouton d'importation */}
          <button
            onClick={handleImportClick}
            disabled={importLoading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importation...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Importer un assistant
              </>
            )}
          </button>
          
          {/* Input file caché */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          
          {/* Bouton de création */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nouvel Assistant
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {stat.change} depuis le mois dernier
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Statistiques avancées (graphiques) */}
      <DashboardStatsCharts />

      {/* Activité récente */}
      <DashboardRecentActivity />

      {/* Recherche */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un assistant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Erreur! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Liste des assistants */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">Chargement des assistants...</span>
        </div>
      ) : filteredAssistants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssistants.slice(0, 3).map((assistant) => (
            <AssistantCard
              key={assistant.id}
              id={assistant.id}
              name={assistant.name}
              description={assistant.description || ""}
              onDelete={() => handleDelete(assistant.id)}
              onDuplicate={() => handleDuplicate(assistant.id)}
              onRename={handleRename}
              onUpdateDescription={handleUpdateDescription}
              onEdit={() => navigate(`/dashboard/chatbots/editor/${assistant.id}`)}
            />
          ))}
          {filteredAssistants.length > 3 && (
            <div className="col-span-full flex justify-center mt-4">
              <button
                onClick={() => navigate('/dashboard/chatbots')}
                className="inline-flex items-center px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium shadow"
              >
                Voir plus d'assistants
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Aucun assistant trouvé</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {searchTerm ? "Aucun résultat pour votre recherche" : "Commencez par créer votre premier assistant"}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Créer un assistant
              </button>
            </div>
          )}
        </div>
      )}

      {/* Formulaire de création */}
      <AssistantForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default DashboardPage;
