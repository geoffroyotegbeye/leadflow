/**
 * Configuration et constantes pour l'application de chat
 */

// URL de base pour les appels API
const baseUrl = window.location.origin;

// Configuration de l'état initial
const initialState = {
  flowData: null,
  messages: [],
  currentNodeId: null,
  sessionId: null,
  isLoading: false,
  typingTimeouts: [],
  selectedOption: null,
  userInfo: {}
};

// Exporter les variables
export { baseUrl, initialState };
