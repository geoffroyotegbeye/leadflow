/**
 * Fonctions pour la gestion de l'interface utilisateur
 */
import { state } from './state.js';
import { generateMessageHTML } from './messageRenderer.js';

// Déclaration des gestionnaires d'événements qui seront importés plus tard
let handleOptionClick, handleFormSubmit, handleInlineInputSubmit;

// Fonction pour injecter les gestionnaires d'événements
export const setEventHandlers = (handlers) => {
  handleOptionClick = handlers.handleOptionClick;
  handleFormSubmit = handlers.handleFormSubmit;
  handleInlineInputSubmit = handlers.handleInlineInputSubmit;
};

// Mettre à jour l'interface utilisateur (optimisée pour ajouter uniquement les nouveaux messages)
const updateUI = () => {
  // Afficher l'indicateur de chargement
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = state.isLoading ? 'flex' : 'none';
  }
  
  // Mettre à jour la liste des messages
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    // Récupérer les messages déjà affichés
    const displayedMessages = Array.from(chatMessages.querySelectorAll('.message'));
    const displayedMessageIds = displayedMessages.map(el => el.dataset.id);
    
    // Vérifier si nous avons des messages à afficher
    if (state.messages.length === 0 && displayedMessages.length > 0) {
      // Si l'état est vide mais que nous avons des messages affichés, les conserver
      console.log("État vide mais messages affichés conservés");
    } else if (state.messages.length > 0) {
      // Si nous avons des messages dans l'état, mettre à jour l'interface
      
      // Option 1: Régénérer complètement la liste des messages (plus sûr)
      chatMessages.innerHTML = '';
      state.messages.forEach(message => {
        const messageHTML = generateMessageHTML(message);
        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        
        // Attacher les écouteurs d'événements
        const messageEl = chatMessages.lastElementChild;
        if (messageEl) {
          // Ajouter une classe pour l'animation
          messageEl.classList.add('new-message');
          
          // Attacher les écouteurs d'événements
          attachEventListenersToMessage(messageEl);
        }
      });
    }
    
    // Toujours défiler vers le bas pour montrer le dernier message
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
};

// Attacher les écouteurs d'événements aux éléments d'un message
const attachEventListenersToMessage = (messageEl) => {
  // Attacher les écouteurs aux boutons d'options
  const optionButtons = messageEl.querySelectorAll('.option-button');
  optionButtons.forEach(button => {
    if (handleOptionClick) {
      button.addEventListener('click', handleOptionClick);
    }
  });
  
  // Attacher les écouteurs aux formulaires
  const forms = messageEl.querySelectorAll('.inline-form');
  forms.forEach(form => {
    if (handleFormSubmit) {
      form.addEventListener('submit', handleFormSubmit);
    }
  });
  
  // Attacher les écouteurs aux champs de saisie inline
  const inlineForms = messageEl.querySelectorAll('.inline-input-form');
  inlineForms.forEach(form => {
    if (handleInlineInputSubmit) {
      form.addEventListener('submit', handleInlineInputSubmit);
    }
  });
};

// Exporter les fonctions
export { updateUI, attachEventListenersToMessage };
