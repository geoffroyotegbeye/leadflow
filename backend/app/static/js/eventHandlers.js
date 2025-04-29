/**
 * Gestionnaires d'événements pour les interactions utilisateur
 */
import { state } from './state.js';
import { addMessage } from './state.js';
import { baseUrl } from './config.js';

// Importer processNodeElements mais permettre son injection ultérieure
let processNodeElements;
export const setNodeProcessor = (processor) => {
  processNodeElements = processor;
};

// Fonction utilitaire pour tracker chaque message/question/réponse
export async function trackMessage(sessionId, content, isQuestion, messageType = "text", nodeId = null) {
  try {
    await fetch(`${baseUrl}/api/analytics/track_message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        content: content,
        is_question: isQuestion,
        message_type: messageType,
        node_id: nodeId
      })
    });
  } catch (err) {
    console.error('Erreur lors du tracking du message:', err);
  }
}

// Gérer le clic sur une option
const handleOptionClick = async (event) => {
  const button = event.currentTarget;
  const option = button.dataset.option;
  const messageId = button.dataset.messageId;
  
  if (!option || !messageId) return;
  
  // Trouver le message correspondant
  const message = state.messages.find(msg => msg.id === messageId);
  if (!message || !message.elementData || !message.elementData.options) return;
  
  // Trouver l'option sélectionnée
  const selectedOption = message.elementData.options.find(opt => opt.text === option);
  if (!selectedOption) return;
  
  // Marquer l'option comme sélectionnée
  state.selectedOption = option;
  
  // Mettre à jour l'UI pour montrer l'option sélectionnée
  const optionButtons = document.querySelectorAll(`.option-button[data-message-id="${messageId}"]`);
  optionButtons.forEach(btn => {
    if (btn.dataset.option === option) {
      btn.classList.add('selected');
    } else {
      btn.classList.add('not-selected');
    }
  });
  
  // Ajouter la réponse de l'utilisateur
  addMessage({
    id: `user-${Date.now()}`,
    content: option,
    type: 'option',
    sender: 'user',
    timestamp: Date.now()
  });
  
  // Tracking analytique
  if (state.sessionId) {
    // Tracker la question affichée (si pas déjà trackée)
    if (message.content && message.nodeId) {
      await trackMessage(state.sessionId, message.content, true, message.type || 'option', message.nodeId);
    }
    // Tracker la réponse utilisateur
    await trackMessage(state.sessionId, option, false, 'option', message.nodeId);
  }
  
  // Désactiver tous les boutons d'options
  optionButtons.forEach(btn => {
    btn.disabled = true;
  });
  
  // Trouver le nœud cible pour cette option
  if (selectedOption.targetNodeId) {
    const targetNode = state.flowData.nodes.find(node => node.id === selectedOption.targetNodeId);
    if (targetNode) {
      state.currentNodeId = targetNode.id;
      await processNodeElements(targetNode);
      return;
    }
  }
  
  // Si pas de nœud cible spécifique, suivre le flux normal
  const currentNode = state.flowData.nodes.find(node => node.id === state.currentNodeId);
  if (currentNode) {
    const outgoingEdge = state.flowData.edges.find(edge => edge.source === currentNode.id);
    if (outgoingEdge) {
      const nextNode = state.flowData.nodes.find(node => node.id === outgoingEdge.target);
      if (nextNode) {
        state.currentNodeId = nextNode.id;
        await processNodeElements(nextNode);
      }
    }
  }
};

// Gérer la soumission d'un formulaire
const handleFormSubmit = async (event) => {
  event.preventDefault();
  
  const form = event.target;
  const messageId = form.dataset.messageId;
  const formData = new FormData(form);
  
  // Convertir les données du formulaire en objet
  const formValues = {};
  for (const [key, value] of formData.entries()) {
    formValues[key] = value;
  }
  
  // Vérifier que tous les champs requis sont remplis
  const requiredFields = form.querySelectorAll('[required]');
  let hasError = false;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      hasError = true;
      // Ajouter une classe d'erreur au champ
      field.classList.add('error');
    } else {
      field.classList.remove('error');
    }
  });
  
  if (hasError) {
    // Afficher un message d'erreur
    const errorContainer = form.querySelector('.form-error');
    if (errorContainer) {
      errorContainer.textContent = 'Veuillez remplir tous les champs requis.';
    }
    return;
  }
  
  // Tracking analytique
  if (state.sessionId) {
    // Tracker la question affichée (si pas déjà trackée)
    const message = state.messages.find(msg => msg.id === messageId);
    if (message && message.content && message.nodeId) {
      await trackMessage(state.sessionId, message.content, true, 'form', message.nodeId);
    }
    // Tracker la réponse utilisateur (formulaire complet)
    await trackMessage(state.sessionId, JSON.stringify(formValues), false, 'form', message?.nodeId || state.currentNodeId);
  }
  
  // Trouver le nœud suivant
  const currentNode = state.flowData.nodes.find(node => node.id === state.currentNodeId);
  if (currentNode) {
    const outgoingEdge = state.flowData.edges.find(edge => edge.source === currentNode.id);
    if (outgoingEdge) {
      const nextNode = state.flowData.nodes.find(node => node.id === outgoingEdge.target);
      if (nextNode) {
        state.currentNodeId = nextNode.id;
        await processNodeElements(nextNode);
      }
    }
  }
};

// Gérer la soumission d'un champ de saisie inline
const handleInlineInputSubmit = async (event) => {
  event.preventDefault();
  
  const form = event.target;
  const messageId = form.dataset.messageId;
  const inputField = form.querySelector('input');
  
  if (!inputField || !inputField.value.trim()) {
    // Afficher un message d'erreur
    const errorContainer = form.querySelector('.inline-input-error');
    if (errorContainer) {
      errorContainer.textContent = 'Veuillez entrer une valeur.';
    }
    return;
  }
  
  const inputValue = inputField.value.trim();
  const inputType = inputField.type || 'text';
  
  // Validation simple
  if (inputType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue)) {
    const errorContainer = form.querySelector('.inline-input-error');
    if (errorContainer) {
      errorContainer.textContent = 'Veuillez entrer un email valide.';
    }
    return;
  }
  
  // Ajouter le message utilisateur
  addMessage({
    id: `user-input-${Date.now()}`,
    content: inputValue,
    type: 'text',
    sender: 'user',
    timestamp: Date.now()
  });
  
  // Désactiver le champ de saisie
  inputField.disabled = true;
  form.querySelector('button')?.setAttribute('disabled', 'true');
  
  // Tracking analytique
  if (state.sessionId) {
    // Tracker la question affichée (si pas déjà trackée)
    const message = state.messages.find(msg => msg.id === messageId);
    if (message && message.content && message.nodeId) {
      await trackMessage(state.sessionId, message.content, true, 'text', message.nodeId);
    }
    // Tracker la réponse utilisateur
    await trackMessage(state.sessionId, inputValue, false, inputType, message?.nodeId || state.currentNodeId);
  }
  
  // Trouver le nœud suivant
  const currentNode = state.flowData.nodes.find(node => node.id === state.currentNodeId);
  if (currentNode) {
    const outgoingEdge = state.flowData.edges.find(edge => edge.source === currentNode.id);
    if (outgoingEdge) {
      const nextNode = state.flowData.nodes.find(node => node.id === outgoingEdge.target);
      if (nextNode) {
        state.currentNodeId = nextNode.id;
        await processNodeElements(nextNode);
      }
    }
  }
};

// Gérer l'envoi d'un message par l'utilisateur
const handleSendMessage = async () => {
  const messageInput = document.getElementById('message-input');
  const messageText = messageInput.value.trim();
  
  if (!messageText) return;
  
  // Ajouter le message utilisateur
  addMessage({
    id: `user-${Date.now()}`,
    content: messageText,
    type: 'text',
    sender: 'user',
    timestamp: Date.now()
  });
  
  // Vider le champ de saisie
  messageInput.value = '';
  
  // Tracking analytique
  if (state.sessionId) {
    // Tracker la question affichée (si pas déjà trackée)
    const currentNode = state.flowData.nodes.find(node => node.id === state.currentNodeId);
    if (currentNode && currentNode.question) {
      await trackMessage(state.sessionId, currentNode.question, true, 'text', currentNode.id);
    }
    // Tracker la réponse utilisateur
    await trackMessage(state.sessionId, messageText, false, 'text', state.currentNodeId);
  }
};

// Exporter les fonctions
export { 
  handleOptionClick, 
  handleFormSubmit, 
  handleInlineInputSubmit, 
  handleSendMessage
  // trackMessage est déjà exporté directement dans sa définition
};
