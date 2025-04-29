/**
 * Point d'entrée principal de l'application de chat
 */
import { state, addMessage, showError, setUpdateUI } from './state.js';
import { updateUI, setEventHandlers } from './ui.js';
import { baseUrl } from './config.js';
import { processNodeElements } from './nodeProcessor.js';
import { 
  handleOptionClick, 
  handleFormSubmit, 
  handleInlineInputSubmit, 
  handleSendMessage,
  setNodeProcessor
} from './eventHandlers.js';

// Injecter updateUI dans le module state
setUpdateUI(updateUI);

// Injecter les gestionnaires d'événements dans le module UI
setEventHandlers({
  handleOptionClick,
  handleFormSubmit,
  handleInlineInputSubmit
});

// Injecter le processeur de nœuds dans le module des gestionnaires d'événements
setNodeProcessor(processNodeElements);

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async () => {
  // Initialisation des éléments DOM
  const chatMessages = document.getElementById('chat-messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  // Attacher les écouteurs d'événements
  sendButton?.addEventListener('click', handleSendMessage);

  // Reload chat au clic sur le bouton reset
  const resetButton = document.getElementById('reset-button');
  resetButton?.addEventListener('click', () => {
    // Vider les messages
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) chatMessages.innerHTML = '';
    // Réinitialiser l'état local
    if (window.localStorage) {
      const publicId = document.getElementById('assistant-data')?.dataset.publicId;
      if (publicId) localStorage.removeItem(`assistant_${publicId}`);
    }
    // Réinitialiser l'état JS
    if (typeof state !== 'undefined') {
      state.messages = [];
      state.currentNode = null;
      state.sessionId = null;
    }
    // Recharger la page pour tout réinitialiser proprement
    window.location.reload();
  });

  messageInput?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  });
  
  darkModeToggle?.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  });
  
  // Appliquer le mode sombre si nécessaire
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.checked = true;
  }
  
  // Initialiser l'application
  await initializeApp();
});

// Fonction d'initialisation de l'application
async function initializeApp() {
  console.log('🚀 Initialisation de l\'application...');
  
  // Récupérer les données de l'assistant
  const assistantDataElement = document.getElementById('assistant-data');
  const assistantId = assistantDataElement.dataset.assistantId;
  const publicId = assistantDataElement.dataset.publicId || getPublicIdFromUrl();
  const baseUrl = assistantDataElement.dataset.baseUrl;
  
  console.log('📋 Données récupérées:', { assistantId, publicId, baseUrl });
  
  // Injecter les dépendances
  console.log('🔄 Injection des dépendances...');
  setUpdateUI(updateUI);
  setEventHandlers({
    handleOptionClick,
    handleFormSubmit,
    handleInlineInputSubmit
  });
  setNodeProcessor(processNodeElements);
  
  // Initialiser l'état
  state.assistantId = assistantId;
  state.publicId = publicId;
  state.baseUrl = baseUrl;
  
  console.log('🔍 Récupération des données du flow pour l\'assistant:', publicId);
  
  try {
    // Vérifier si les données sont déjà en cache
    const cachedData = localStorage.getItem(`assistant_${publicId}`);
    let data;
    
    if (cachedData) {
      console.log('📦 Données trouvées dans le cache local');
      data = JSON.parse(cachedData);
      console.log('📋 Données du cache:', data);
    } else {
      // Charger les données du flow depuis l'API
      const flowUrl = `${baseUrl}/api/assistants/${publicId}/flow`;
      console.log('📡 Appel API:', flowUrl);
      const response = await fetch(flowUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      data = await response.json();
      console.log('✅ Données du flow récupérées de l\'API:', data);
      
      // Sauvegarder les données dans le localStorage
      localStorage.setItem(`assistant_${publicId}`, JSON.stringify(data));
      console.log('💾 Données sauvegardées dans le cache local');
    }
    
    console.log('🔍 ID de l\'assistant:', data.id);
    console.log('📋 Nom de l\'assistant:', data.name);
    console.log('🔢 Nombre de nœuds:', data.nodes.length);
    console.log('🔗 Nombre de connexions:', data.edges.length);
    
    // Afficher les données complètes dans la console pour débogage
    console.log('📊 Données complètes de l\'assistant:', data);
    
    state.flowData = data;
    
    // Créer une session pour la conversation
    console.log('🔄 Création d\'une nouvelle session...');
    console.log('📋 Données pour la création de session:', { 
      assistant_id: data.id,
      user_info: {
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timestamp: new Date().toISOString(),
        public_id: publicId // Ajouté pour référence
      }
    });
    
    try {
      const sessionResponse = await fetch(`${baseUrl}/api/sessions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistant_id: data.id,
          user_info: {
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            language: navigator.language,
            timestamp: new Date().toISOString(),
            public_id: publicId // Ajouté pour référence
          }
        })
      });
      
      if (!sessionResponse.ok) {
        console.error(`❌ Erreur lors de la création de la session: ${sessionResponse.status}`);
        console.log('⚠️ Continuons sans session pour le moment...');
      } else {
        const sessionData = await sessionResponse.json();
        console.log('✅ Session créée:', sessionData);
        state.sessionId = sessionData.id;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de la session:', error);
      console.log('⚠️ Continuons sans session pour le moment...');
    }
    
    // Trouver le nœud de départ
    const startNode = data.nodes.find(node => 
      node.type === 'startNode' || 
      data.edges.every(edge => edge.target !== node.id)
    );
    
    if (startNode) {
      state.currentNodeId = startNode.id;
      await processNodeElements(startNode);
    } else {
      showError('Impossible de trouver le nœud de départ.');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    showError('Impossible de charger l\'assistant. Veuillez réessayer plus tard.');
  }
}

function getPublicIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  let publicId = urlParams.get('id');
  
  // Si l'ID n'est pas dans les paramètres d'URL, essayer de le récupérer depuis les data-attributes
  if (!publicId) {
    const assistantData = document.getElementById('assistant-data');
    if (assistantData) {
      publicId = assistantData.dataset.publicId;
    }
    
    // Si toujours pas d'ID, essayer de l'extraire du chemin de l'URL
    if (!publicId) {
      const pathParts = window.location.pathname.split('/');
      publicId = pathParts[pathParts.length - 1];
    }
  }
  
  return publicId;
}
