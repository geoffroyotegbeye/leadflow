import axios, { AxiosError } from 'axios';
import { Node, Edge } from 'reactflow';
import Cookies from 'js-cookie';

// Configuration des cookies
const TOKEN_COOKIE = 'leadflow_token';

// Configuration de l'API
// Avec Vite, les variables d'environnement sont accessibles via import.meta.env
// et doivent être préfixées par VITE_
const API_URL = 'http://localhost:8000/api';

// Configuration d'Axios avec timeout et retry
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 secondes de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteur pour les requêtes
apiClient.interceptors.request.use(
  (config) => {
    // Ajouter le token d'authentification depuis les cookies
    const token = Cookies.get(TOKEN_COOKIE);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`🔒 Token d'authentification ajouté pour ${config.method?.toUpperCase()} ${config.url}`);
    } else {
      console.warn(`⚠️ Aucun token d'authentification trouvé pour ${config.method?.toUpperCase()} ${config.url}`);
      // Vérifier si l'utilisateur est sur une page qui nécessite l'authentification
      if (window.location.pathname.includes('/dashboard') || 
          window.location.pathname.includes('/editor') ||
          window.location.pathname.includes('/settings')) {
        console.error('❌ Tentative d\'accès à une ressource protégée sans authentification');
      }
    }
    
    console.log(`🔄 Requête API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Erreur lors de la configuration de la requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Réponse API: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'état en dehors de la plage 2xx
      const errorDetail = error.response.data && typeof error.response.data === 'object' && 'detail' in (error.response.data as any)
        ? (error.response.data as any).detail
        : JSON.stringify(error.response.data);
      console.error(`❌ Erreur API ${error.response.status}: ${errorDetail}`);
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('❌ Pas de réponse du serveur. Vérifiez que le backend est en cours d\'exécution.');
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('❌ Erreur de configuration de la requête:', error.message);
    }
    return Promise.reject(error);
  }
);

// Interface pour les données d'un assistant
export interface Assistant {
  id?: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  is_published?: boolean;
  publish_date?: string;
  public_id?: string;
  public_url?: string;
  embed_script?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface pour la réponse du script d'intégration
export interface EmbedScriptResponse {
  script: string;
  public_url: string;
}

// Fonction pour logger les erreurs avec plus de détails
const logError = (message: string, error: any) => {
  console.error(`❌ ${message}`);
  if (error.response) {
    console.error(`  Status: ${error.response.status}`);
    console.error(`  Data:`, error.response.data);
  } else if (error.request) {
    console.error(`  Pas de réponse du serveur. Vérifiez que le backend est en cours d'exécution.`);
  } else {
    console.error(`  Message: ${error.message}`);
  }
  console.error(`  Stack:`, error.stack);
};

// Service API pour les assistants
const AssistantService = {
  // Récupérer tous les assistants
  async getAll(): Promise<Assistant[]> {
    try {
      console.log('🔍 Récupération de tous les assistants...');
      // Utiliser apiClient pour bénéficier de l'intercepteur d'authentification
      const response = await apiClient.get('/assistants/');
      console.log('Assistants récupérés avec succès:', response.data);
      return response.data;
    } catch (error: any) {
      logError('Erreur lors de la récupération des assistants', error);
      throw error;
    }
  },

  // Récupérer un assistant par son ID
  async getById(id: string): Promise<Assistant> {
    try {
      console.log(`🔍 Récupération de l'assistant ${id}...`);
      const response = await apiClient.get(`/assistants/${id}`);
      console.log(`✅ Assistant ${id} récupéré avec succès:`, response.data.name);
      return response.data;
    } catch (error: any) {
      logError(`Erreur lors de la récupération de l'assistant ${id}`, error);
      throw error;
    }
  },

  // Créer un nouvel assistant
  async create(assistant: Assistant): Promise<Assistant> {
    try {
      console.log('📝 Création d\'un nouvel assistant...');
      const response = await apiClient.post('/assistants/', assistant);
      console.log('✅ Assistant créé avec succès:', response.data.id);
      return response.data;
    } catch (error: any) {
      logError('Erreur lors de la création de l\'assistant', error);
      throw error;
    }
  },

  // Mettre à jour un assistant existant
  async update(id: string, assistant: Partial<Assistant>): Promise<Assistant> {
    try {
      console.log(`📝 Mise à jour de l'assistant ${id}...`);
      const response = await apiClient.put(`/assistants/${id}`, assistant);
      console.log(`✅ Assistant ${id} mis à jour avec succès`);
      return response.data;
    } catch (error: any) {
      logError(`Erreur lors de la mise à jour de l'assistant ${id}`, error);
      throw error;
    }
  },

  // Supprimer un assistant
  async delete(id: string): Promise<void> {
    try {
      console.log(`🚮 Suppression de l'assistant ${id}...`);
      await apiClient.delete(`/assistants/${id}`);
      console.log(`✅ Assistant ${id} supprimé avec succès`);
    } catch (error: any) {
      logError(`Erreur lors de la suppression de l'assistant ${id}`, error);
      throw error;
    }
  },

  // Sauvegarder le flowchart d'un assistant (nodes et edges)
  async saveFlowchart(id: string, nodes: Node[], edges: Edge[]): Promise<Assistant> {
    try {
      console.log(`💾 Sauvegarde du flowchart de l'assistant ${id}...`);
      
      // Calculer la taille approximative des données
      const data = { nodes, edges, updated_at: new Date().toISOString() };
      const dataSize = JSON.stringify(data).length;
      console.log(`Taille des données: ${(dataSize / 1024).toFixed(2)} KB`);
      
      // Si les données sont volumineuses, afficher un avertissement
      if (dataSize > 1024 * 1024) { // Plus de 1MB
        console.log('⚠️ Données volumineuses, la requête peut prendre plus de temps');
      }
      
      // Utiliser apiClient avec l'intercepteur d'authentification
      const response = await apiClient.put(`/assistants/${id}`, data);
      
      console.log(`✅ Flowchart de l'assistant ${id} sauvegardé avec succès`);
      return response.data;
    } catch (error: any) {
      logError(`Erreur lors de la sauvegarde du flowchart de l'assistant ${id}`, error);
      throw error;
    }
  },

  // Importer un assistant depuis un fichier JSON
  async importFromJson(jsonData: any): Promise<Assistant> {
    try {
      console.log('📥 Importation d\'un assistant depuis JSON...');
      
      // Vérifier que le JSON contient les données nécessaires
      if (!jsonData.name || !jsonData.nodes || !jsonData.edges) {
        throw new Error('Le fichier JSON ne contient pas les données nécessaires (name, nodes, edges)');
      }
      
      // Créer l'assistant avec apiClient
      const response = await apiClient.post('/assistants/', jsonData);
      
      console.log('✅ Assistant importé avec succès:', response.data.id);
      return response.data;
    } catch (error: any) {
      logError('Erreur lors de l\'importation de l\'assistant', error);
      throw error;
    }
  },

  // Publier ou dépublier un assistant
  async publishAssistant(id: string, isPublished: boolean): Promise<Assistant> {
    try {
      console.log(`${isPublished ? '💬 Publication' : '🔒 Dépublication'} de l'assistant ${id}...`);
      const response = await apiClient.put(`/assistants/${id}/publish`, { is_published: isPublished });
      console.log(`✅ Assistant ${id} ${isPublished ? 'publié' : 'dépublié'} avec succès`);
      return response.data;
    } catch (error: any) {
      logError(`Erreur lors de la ${isPublished ? 'publication' : 'dépublication'} de l'assistant ${id}`, error);
      throw error;
    }
  },

  // Obtenir le script d'intégration pour un assistant publié
  async getEmbedScript(id: string): Promise<EmbedScriptResponse> {
    try {
      console.log(`💻 Génération du script d'intégration pour l'assistant ${id}...`);
      const response = await apiClient.get(`/assistants/${id}/embed`);
      console.log(`✅ Script d'intégration généré avec succès`);
      return response.data;
    } catch (error: any) {
      logError(`Erreur lors de la génération du script d'intégration pour l'assistant ${id}`, error);
      throw error;
    }
  }
};

export default AssistantService;
