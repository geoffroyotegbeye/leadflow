/**
 * Gestion de l'état de l'application
 */
import { initialState } from './config.js';

// État global de l'application
const state = { ...initialState };

// Référence à la fonction updateUI qui sera injectée plus tard
let updateUIFunction = () => {};

// Fonction pour injecter updateUI
export const setUpdateUI = (updateUI) => {
  updateUIFunction = updateUI;
};

// Mettre à jour un message existant
const updateMessage = (messageId, updates) => {
  state.messages = state.messages.map(msg => {
    if (msg.id === messageId) {
      return { ...msg, ...updates };
    }
    return msg;
  });
  updateUIFunction();
};

// Ajouter un nouveau message
const addMessage = (message) => {
  state.messages.push(message);
  updateUIFunction();
  
  // Faire défiler vers le bas
  setTimeout(() => {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, 100);
};

// Afficher une erreur
const showError = (message) => {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }
  
  console.error(message);
};

export { state, updateMessage, addMessage, showError };
