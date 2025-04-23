import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AssistantService, { Assistant } from "../services/api";
import AssistantCard from "../components/dashboard/AssistantCard";
import AssistantForm from "../components/dashboard/AssistantForm";
import Spinner from "../components/ui/Spinner";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/ToastContainer";
import { PlusIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const ChatbotsPage: React.FC = () => {
  const { showToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    setLoading(true);
    try {
      const data = await AssistantService.getAll();
      setAssistants(data);
    } catch (e) {
      setAssistants([]);
    }
    setLoading(false);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportLoading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const imported = await AssistantService.importFromJson(json);
      setAssistants(prev => [...prev, imported]);
      setImportError(null);
    } catch (err) {
      setImportError("Le fichier JSON sélectionné n'est pas valide ou ne contient pas les données requises.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleCreate = async (assistant: { name: string; description: string }) => {
    try {
      // Créer un nouvel assistant avec des nodes et edges vides
      const newAssistant: Assistant = {
        ...assistant,
        nodes: [],
        edges: []
      };
      const created = await AssistantService.create(newAssistant);
      setAssistants(prev => [...prev, created]);
      setShowForm(false);
    } catch (err) {
      setImportError("Impossible de créer l'assistant. Veuillez réessayer plus tard.");
    }
  };

  const filteredAssistants = assistants.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Supprimer un assistant
  const handleDelete = async (id: string) => {
    const assistant = assistants.find(a => a.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer l'assistant",
      message: `Êtes-vous sûr de vouloir supprimer l'assistant "${assistant?.name || 'Sans nom'}" ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          await AssistantService.delete(id);
          setAssistants(prev => prev.filter(a => a.id !== id));
          showToast({ type: 'success', message: 'Assistant supprimé avec succès' });
        } catch (err) {
          showToast({ type: 'error', message: 'Impossible de supprimer l\'assistant. Veuillez réessayer plus tard.' });
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Dupliquer un assistant
  const handleDuplicate = async (id: string) => {
    try {
      const assistant = await AssistantService.getById(id);
      const duplicatedAssistant = {
        ...assistant,
        name: `${assistant.name} (Copie)`,
        id: undefined,
      };
      const created = await AssistantService.create(duplicatedAssistant);
      setAssistants(prev => [...prev, created]);
      showToast({ type: 'success', message: `Assistant "${assistant.name}" dupliqué avec succès` });
    } catch (err) {
      showToast({ type: 'error', message: 'Impossible de dupliquer l\'assistant. Veuillez réessayer plus tard.' });
    }
  };

  // Renommer un assistant
  const handleRename = async (id: string, newName: string) => {
    try {
      await AssistantService.update(id, { name: newName });
      setAssistants(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
      showToast({ type: 'success', message: 'Nom mis à jour avec succès' });
    } catch (err) {
      showToast({ type: 'error', message: 'Impossible de renommer l\'assistant. Veuillez réessayer plus tard.' });
    }
  };

  // Mettre à jour la description
  const handleUpdateDescription = async (id: string, newDescription: string) => {
    try {
      await AssistantService.update(id, { description: newDescription });
      setAssistants(prev => prev.map(a => a.id === id ? { ...a, description: newDescription } : a));
      showToast({ type: 'success', message: 'Description mise à jour avec succès' });
    } catch (err) {
      showToast({ type: 'error', message: 'Impossible de mettre à jour la description. Veuillez réessayer plus tard.' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        type="danger"
      />
      {/* Modale création assistant */}
      <AssistantForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Chatbots</h1>
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
            accept=".json,application/json"
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
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un assistant..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {importError && (
        <div className="text-red-600 mb-4">{importError}</div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner />
        </div>
      ) : filteredAssistants.length === 0 ? (
        <div className="text-gray-500 text-center">Aucun assistant trouvé.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssistants.map(a => (
            <AssistantCard
              key={a.id}
              id={a.id || ''}
              name={a.name}
              description={a.description || ''}
              onEdit={() => navigate(`/dashboard/chatbots/editor/${a.id}`)}
              onDelete={() => handleDelete(a.id || '')}
              onDuplicate={() => handleDuplicate(a.id || '')}
              onRename={handleRename}
              onUpdateDescription={handleUpdateDescription}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatbotsPage;
