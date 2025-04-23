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
  
  // Envoyer la sélection au backend pour les analytics
  if (state.sessionId) {
    try {
      await fetch(`${baseUrl}/api/sessions/${state.sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: 'user',
          content: option,
          content_type: 'option',
          node_id: message.nodeId,
          metadata: {
            option_text: option,
            timestamp: Date.now()
          }
        })
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la sélection:', error);
    }
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
  
  // Formater les données pour l'affichage
  const formattedContent = Object.entries(formValues)
    .map(([key, value]) => {
      // Récupérer le label du champ si disponible
      const field = form.querySelector(`[name="${key}"]`);
      const label = field ? field.previousElementSibling?.textContent || key : key;
      return `${label}: ${value}`;
    })
    .join('\n');
  
  // Ajouter le message utilisateur
  addMessage({
    id: `user-form-${Date.now()}`,
    content: formattedContent,
    type: 'form',
    sender: 'user',
    timestamp: Date.now()
  });
  
  // Désactiver le formulaire
  form.querySelectorAll('input, select, textarea, button').forEach(el => {
    el.disabled = true;
  });
  
  // Envoyer les données au backend
  if (state.sessionId) {
    try {
      await fetch(`${baseUrl}/api/sessions/${state.sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: 'user',
          content: formattedContent,
          content_type: 'form',
          node_id: state.currentNodeId,
          metadata: {
            form_values: formValues,
            timestamp: Date.now()
          }
        })
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du message:', error);
    }
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
  
  // Envoyer les données au backend
  if (state.sessionId) {
    try {
      await fetch(`${baseUrl}/api/sessions/${state.sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: 'user',
          content: inputValue,
          content_type: 'text',
          node_id: state.currentNodeId,
          metadata: {
            input_type: inputField.type,
            timestamp: Date.now()
          }
        })
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du message:', error);
    }
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
const handleSendMessage = () => {
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
  
  // Envoyer le message au backend
  if (state.sessionId) {
    fetch(`${baseUrl}/api/sessions/${state.sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: 'user',
        content: messageText,
        content_type: 'text',
        node_id: state.currentNodeId,
        metadata: {
          timestamp: Date.now()
        }
      })
    }).catch(error => {
      console.error('Erreur lors de l\'enregistrement du message:', error);
    });
  }
};

// Exporter les fonctions
export { 
  handleOptionClick, 
  handleFormSubmit, 
  handleInlineInputSubmit, 
  handleSendMessage 
};
