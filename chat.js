/**
 * LeadFlow Public Chat Interface
 * Script principal pour l'interface de chat publique
 */

// Configuration initiale
document.addEventListener('DOMContentLoaded', async () => {
  // Initialisation des variables
  const chatMessages = document.getElementById('chat-messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const resetButton = document.getElementById('reset-button');
  // const themeToggle = document.getElementById('theme-toggle'); // supprimé car plus de bouton dark mode
  const assistantId = document.getElementById('assistant-data').dataset.assistantId;
  const publicId = document.getElementById('assistant-data').dataset.publicId;
  const baseUrl = document.getElementById('assistant-data').dataset.baseUrl;
  
  // État de l'application
  const state = {
    messages: [],
    currentNodeId: null,
    flowData: { nodes: [], edges: [] },
    isLoading: true,
    typingTimeouts: [],
    selectedOption: null,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    sessionId: null,
    sessionStartTime: Date.now(),
    lastNodeTime: Date.now(),
    userInfo: {
      source: new URLSearchParams(window.location.search).get('source') || 'direct',
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent
    }
  };

  // Appliquer le mode sombre si nécessaire
  if (state.darkMode) {
    document.body.classList.add('dark');
  }

  // Charger les données du flow
  const loadFlowData = async () => {
    state.isLoading = true;
    updateUI();
    
    // Récupérer les données du flow depuis l'API
    const response = await fetch(`${baseUrl}/api/assistants/${assistantId}/flow`);
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des données');
    }
    
    const data = await response.json();
    state.flowData = data;
    state.isLoading = false;
    updateUI();
    
    // Initialiser la conversation
    await initializeChat();
  };
  
  // Initialiser la conversation
  const initializeChat = async () => {
    // Trouver le nœud de départ
    const startNode = state.flowData.nodes.find(node => {
      // Soit c'est explicitement un nœud de départ
      if (node.type === 'startNode') return true;
      
      // Soit c'est un nœud qui n'a pas de connexion entrante
      return !state.flowData.edges.some(edge => edge.target === node.id);
    });
    
    if (startNode) {
      state.currentNodeId = startNode.id;
      
      // Créer une session pour la conversation
      try {
        const response = await fetch(`${baseUrl}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assistant_id: state.flowData.id
          })
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la création de la session');
        }
        
        const sessionData = await response.json();
        state.sessionId = sessionData.id;
        
        // Traiter les éléments du nœud de départ
        await processNodeElements(startNode);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la conversation:', error);
        addMessage({
          id: `error-${Date.now()}`,
          content: "Erreur: Impossible d'initialiser la conversation. Veuillez réessayer plus tard.",
          type: 'text',
          sender: 'bot',
          timestamp: Date.now()
        });
      }
    } else {
      addMessage({
        id: `error-${Date.now()}`,
        content: "Erreur: Impossible de trouver le nœud de départ.",
        type: 'text',
        sender: 'bot',
        timestamp: Date.now()
      });
    }
  };
  
  // Traiter les éléments d'un nœud
  const processNodeElements = async (node) => {
    if (!node || !node.data || !node.data.elements) {
      console.warn('Nœud invalide ou sans éléments:', node);
      return;
    }
    
    // Envoyer un message au backend pour indiquer que l'utilisateur est sur ce nœud
    if (state.sessionId) {
      try {
        await fetch(`${baseUrl}/api/sessions/${state.sessionId}/nodes/${node.id}/viewed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la vue du nœud:', error);
      }
    }
    
    // Traiter chaque élément du nœud séquentiellement
    for (const element of node.data.elements) {
      // Ajouter un message avec état de frappe
      const messageId = `bot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      addMessage({
        id: messageId,
        nodeId: node.id,
        content: '',
        type: element.type,
        sender: 'bot',
        timestamp: Date.now(),
        isTyping: true,
        elementData: element
      });
      
      // Simuler le temps de frappe
      const typingTime = Math.max(500, element.content ? element.content.length * 10 : 500);
      
      await new Promise(resolve => setTimeout(resolve, typingTime));
      
      // Mettre à jour le message avec le contenu réel
      updateMessage(messageId, {
        content: element.content || '',
        isTyping: false
      });
      
      // Si c'est un élément avec des options ou un formulaire, attendre que l'utilisateur interagisse
      if (
        (element.type === 'options' && element.options && element.options.length > 0) ||
        (element.type === 'form' && element.formFields && element.formFields.length > 0) ||
        (element.type === 'input')
      ) {
        // Arrêter le traitement des éléments suivants jusqu'à ce que l'utilisateur interagisse
        break;
      }
    }
  };
  
  // Ajouter un message à la conversation
  const addMessage = (message) => {
    state.messages.push(message);
    
    // Au lieu de régénérer toute la conversation, ajouter seulement le nouveau message
    if (!state.isLoading && state.messages.length > 0) {
      appendMessageToUI(message, state.messages.length - 1);
    } else {
      // Cas particulier: premier message ou chargement, utiliser updateUI complet
      updateUI();
    }
    
    scrollToBottom();
  };
  
  // Générer le HTML pour un seul message et l'ajouter au DOM
  const appendMessageToUI = (message, idx) => {
    // Déterminer si l'entête Bot doit être affichée
    let showBotHeader = false;
    if (message.sender === 'bot') {
      if (idx === 0 || state.messages[idx - 1].sender !== 'bot') {
        showBotHeader = true;
      }
    }
    
    const messageClass = message.sender === 'user' ? 'user-message' : 'assistant-message';
    
    // Créer un élément div pour le message
    const messageEl = document.createElement('div');
    messageEl.className = `message ${messageClass}`;
    messageEl.dataset.messageId = message.id; // Stocker l'ID pour référence future
    
    // Générer le HTML pour le contenu du message
    let messageHTML = '';
    
    // Entête pour les messages du bot
    if (message.sender === 'bot' && showBotHeader) {
      messageHTML += `
        <div class="bot-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
          <span>Assistant</span>
        </div>
      `;
    }
    
    // Contenu du message selon son type
    if (message.isTyping) {
      messageHTML += `
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
    } else {
      // Ajouter le contenu selon le type de message
      // (Le reste du code de génération HTML pour les différents types de messages reste identique)
      // On utilisera la même logique que dans updateUI
      
      // Contenu du message selon son type
      if (message.type === 'image' && message.elementData?.mediaUrl) {
        messageHTML += generateMediaHTML(message, 'image');
      } else if (message.type === 'video' && message.elementData?.mediaUrl) {
        messageHTML += generateMediaHTML(message, 'video');
      } else if (message.type === 'audio' && message.elementData?.mediaUrl) {
        messageHTML += generateMediaHTML(message, 'audio');
      } else if (message.type === 'form' && message.content) {
        messageHTML += generateFormResponseHTML(message);
      } else {
        messageHTML += `<span>${message.content}</span>`;
      }
      
      // Ajouter les options si présentes
      if (message.sender === 'bot' && message.elementData?.options && message.elementData.options.length > 0) {
        messageHTML += generateOptionsHTML(message);
      }
      
      // Ajouter le formulaire si c'est un élément de type form
      if (message.sender === 'bot' && message.type === 'form' && 
          message.elementData?.formFields && message.elementData.formFields.length > 0) {
        messageHTML += generateFormHTML(message);
      }
      
      // Ajouter le champ de saisie si c'est un élément de type input
      if (message.sender === 'bot' && message.type === 'input') {
        messageHTML += generateInputHTML(message);
      }
    }
    
    // Définir le HTML du message
    messageEl.innerHTML = messageHTML;
    
    // Ajouter le message au conteneur
    chatMessages.appendChild(messageEl);
    
    // Attacher les écouteurs d'événements aux éléments du nouveau message
    attachEventListenersToMessage(messageEl);
  };
  
  // Générer le HTML pour les réponses de formulaire
  const generateFormResponseHTML = (message) => {
    // Afficher simplement le contenu du message pour les réponses de formulaire
    return `<div class="form-response">${message.content}</div>`;
  };
  
  // Générer le HTML pour les formulaires
  const generateFormHTML = (message) => {
    const formFields = message.elementData.formFields || [];
    if (formFields.length === 0) return '';
    
    let formHTML = `
      <form class="chat-form" data-message-id="${message.id}">
        <div class="form-fields">
    `;
    
    formFields.forEach(field => {
      const fieldId = `form-field-${message.id}-${field.id || Math.random().toString(36).substring(2, 9)}`;
      const isRequired = field.required ? 'required' : '';
      
      switch (field.type) {
        case 'text':
        case 'email':
        case 'number':
        case 'tel':
        case 'url':
          formHTML += `
            <div class="form-field">
              <label for="${fieldId}">${field.label || field.placeholder || 'Texte'}</label>
              <input 
                type="${field.type}" 
                id="${fieldId}" 
                name="${field.name || field.id || fieldId}" 
                placeholder="${field.placeholder || ''}" 
                ${isRequired}
              >
            </div>
          `;
          break;
        case 'textarea':
          formHTML += `
            <div class="form-field">
              <label for="${fieldId}">${field.label || field.placeholder || 'Texte'}</label>
              <textarea 
                id="${fieldId}" 
                name="${field.name || field.id || fieldId}" 
                placeholder="${field.placeholder || ''}" 
                rows="4"
                ${isRequired}
              ></textarea>
            </div>
          `;
          break;
        case 'select':
          const options = field.options || [];
          formHTML += `
            <div class="form-field">
              <label for="${fieldId}">${field.label || 'Sélectionner'}</label>
              <select 
                id="${fieldId}" 
                name="${field.name || field.id || fieldId}" 
                ${isRequired}
              >
                <option value="" disabled selected>${field.placeholder || 'Sélectionnez une option'}</option>
          `;
          
          options.forEach(option => {
            const optionValue = typeof option === 'string' ? option : (option.value || option.label || option.text || option);
            const optionText = typeof option === 'string' ? option : (option.text || option.label || option.value || option);
            formHTML += `<option value="${optionValue}">${optionText}</option>`;
          });
          
          formHTML += `
              </select>
            </div>
          `;
          break;
        case 'checkbox':
          formHTML += `
            <div class="form-field checkbox-field">
              <input 
                type="checkbox" 
                id="${fieldId}" 
                name="${field.name || field.id || fieldId}" 
                ${isRequired}
              >
              <label for="${fieldId}">${field.label || 'Option'}</label>
            </div>
          `;
          break;
        case 'radio':
          const radioOptions = field.options || [];
          formHTML += `
            <div class="form-field radio-group">
              <div class="radio-group-label">${field.label || 'Options'}</div>
          `;
          
          radioOptions.forEach((option, idx) => {
            const radioId = `${fieldId}-${idx}`;
            const optionValue = typeof option === 'string' ? option : (option.value || option.text || option);
            const optionText = typeof option === 'string' ? option : (option.text || option.label || option.value || option);
            
            formHTML += `
              <div class="radio-option">
                <input 
                  type="radio" 
                  id="${radioId}" 
                  name="${field.name || field.id || fieldId}" 
                  value="${optionValue}"
                  ${idx === 0 && field.required ? 'required' : ''}
                >
                <label for="${radioId}">${optionText}</label>
              </div>
            `;
          });
          
          formHTML += `
            </div>
          `;
          break;
      }
    });
    
    formHTML += `
        </div>
        <div class="form-actions">
          <button type="submit" class="form-submit-button">${message.elementData.submitButtonText || 'Envoyer'}</button>
        </div>
        <div class="form-error"></div>
      </form>
    `;
    
    return formHTML;
  };
  
  // Générer le HTML pour les champs de saisie
  const generateInputHTML = (message) => {
    const inputType = message.elementData?.inputType || 'text';
    
    return `
      <div class="inline-input-container" id="input-${message.id}">
        <form class="inline-input-form" data-message-id="${message.id}">
          <div class="inline-input-field">
            <input 
              type="${inputType}" 
              class="input-field" 
              placeholder="${message.elementData?.placeholder || `Entrez votre ${inputType === 'email' ? 'email' : inputType === 'number' ? 'numéro' : 'réponse'}...`}" 
              required
            >
            <button type="submit" class="input-submit-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <div class="inline-input-error"></div>
        </form>
      </div>
    `;
  };
  
  // Générer le HTML pour les médias (images, vidéos, audio)
  const generateMediaHTML = (message, mediaType) => {
    let mediaHTML = '<div class="media-container">';
    
    if (mediaType === 'image') {
      mediaHTML += `<img src="${message.elementData.mediaUrl}" alt="${message.content || 'Image'}" onerror="this.src='https://via.placeholder.com/400x300?text=Image+non+disponible'">`;
    } else if (mediaType === 'video') {
      mediaHTML += `<video src="${message.elementData.mediaUrl}" controls></video>`;
    } else if (mediaType === 'audio') {
      mediaHTML += `<audio src="${message.elementData.mediaUrl}" controls></audio>`;
    }
    
    if (message.content) {
      mediaHTML += `<div class="media-caption">${message.content}</div>`;
    }
    
    mediaHTML += '</div>';
    return mediaHTML;
  };
  
  // Générer le HTML pour les options
  const generateOptionsHTML = (message) => {
    let optionsHTML = `<div class="options-container">`;
    
    message.elementData.options.forEach((option, index) => {
      const isSelected = state.selectedOption === option.text;
      const selectedClass = isSelected ? 'selected' : '';
      
      optionsHTML += `
        <button class="option-button ${selectedClass}" data-option="${option.text}" data-message-id="${message.id}">
          ${option.imageUrl ? `<img src="${option.imageUrl}" alt="${option.text || `Option ${index+1}`}" onerror="this.src='https://via.placeholder.com/80?text=Error'">` : ''}
          <span>${option.text}</span>
        </button>
      `;
    });
    
    optionsHTML += `</div>`;
    return optionsHTML;
  };
  
  // Attacher les écouteurs d'événements aux éléments d'un message
  const attachEventListenersToMessage = (messageEl) => {
    // Attacher les écouteurs aux boutons d'options
    const optionButtons = messageEl.querySelectorAll('.option-button');
    optionButtons.forEach(button => {
      button.addEventListener('click', handleOptionClick);
    });
    
    // Attacher les écouteurs aux formulaires
    const forms = messageEl.querySelectorAll('.inline-form');
    forms.forEach(form => {
      form.addEventListener('submit', handleFormSubmit);
    });
    
    // Attacher les écouteurs aux champs de saisie inline
    const inlineForms = messageEl.querySelectorAll('.inline-input-form');
    inlineForms.forEach(form => {
      form.addEventListener('submit', handleInlineInputSubmit);
    });
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
            session_id: state.sessionId,
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
            session_id: state.sessionId,
            sender: 'user',
            content: inputValue,
            content_type: 'text',
            node_id: state.currentNodeId,
            metadata: {
              input_type: inputType,
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
          processNodeElements(nextNode);
        }
      }
    }
  };
  
  // Mettre à jour l'interface utilisateur (régénération complète)
  const updateUI = () => {
    // Afficher l'indicateur de chargement
    if (state.isLoading) {
      chatMessages.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>
      `;
      return;
    }
    
    // Afficher les messages
    if (state.messages.length === 0) {
      chatMessages.innerHTML = `
        <div class="empty-state">
          <p>Aucun message</p>
        </div>
      `;
      return;
    }
    
    // Générer le HTML pour chaque message
    let html = '';
    state.messages.forEach((message, idx) => {
      // Déterminer si l'entête Bot doit être affichée
      let showBotHeader = false;
      if (message.sender === 'bot') {
        if (idx === 0 || state.messages[idx - 1].sender !== 'bot') {
          showBotHeader = true;
        }
      }
      
      const messageClass = message.sender === 'user' ? 'user-message' : 'assistant-message';
      
      html += `<div class="message ${messageClass}">`;
      
      // Entête pour les messages du bot
      if (message.sender === 'bot' && showBotHeader) {
        html += `
          <div class="bot-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            <span>Assistant</span>
          </div>
        `;
      }
      
      // Contenu du message selon son type
      if (message.isTyping) {
        html += `
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        `;
      } else {
        // Contenu du message selon son type
        if (message.type === 'image' && message.elementData?.mediaUrl) {
          html += `
            <div class="media-container">
              <img src="${message.elementData.mediaUrl}" alt="${message.content || 'Image'}" onerror="this.src='https://via.placeholder.com/400x300?text=Image+non+disponible'">
              ${message.content ? `<div class="media-caption">${message.content}</div>` : ''}
            </div>
          `;
        } else if (message.type === 'video' && message.elementData?.mediaUrl) {
          html += `
            <div class="media-container">
              <video src="${message.elementData.mediaUrl}" controls></video>
              ${message.content ? `<div class="media-caption">${message.content}</div>` : ''}
            </div>
          `;
        } else if (message.type === 'audio' && message.elementData?.mediaUrl) {
          html += `
            <div class="media-container">
              <audio src="${message.elementData.mediaUrl}" controls></audio>
              ${message.content ? `<div class="media-caption">${message.content}</div>` : ''}
            </div>
          `;
        } else if (message.type === 'form' && message.content) {
          html += `<div class="form-response">`;
          message.content.split('\n').forEach(line => {
            const [label, value] = line.split(': ');
            html += `
              <div class="form-response-item">
                <span class="form-response-label">${label}:</span>
                <span class="form-response-value">${value}</span>
              </div>
            `;
          });
          html += `</div>`;
        } else {
          html += `<span>${message.content}</span>`;
        }
        
        // Ajouter les options si présentes
        if (message.sender === 'bot' && !message.isTyping && 
            message.elementData?.options && message.elementData.options.length > 0) {
          html += `<div class="options-container">`;
          
          message.elementData.options.forEach((option, index) => {
            const isSelected = state.selectedOption === option.text;
            const selectedClass = isSelected ? 'selected' : '';
            
            html += `
              <button class="option-button ${selectedClass}" data-option="${option.text}" data-message-id="${message.id}">
                ${option.imageUrl ? `<img src="${option.imageUrl}" alt="${option.text || `Option ${index+1}`}" onerror="this.src='https://via.placeholder.com/80?text=Error'">` : ''}
                <span>${option.text}</span>
              </button>
            `;
          });
          
          html += `</div>`;
        }
        
        // Ajouter le formulaire si c'est un élément de type form
        if (message.sender === 'bot' && !message.isTyping && message.type === 'form' && 
            message.elementData?.formFields && message.elementData.formFields.length > 0) {
          html += `
            <div class="form-container" id="form-${message.id}">
              <form class="inline-form" data-message-id="${message.id}">
          `;
          
          message.elementData.formFields.forEach(field => {
            html += `
              <div class="form-field">
                <label for="${field.name}">${field.label || field.name}</label>
            `;
            
            if (field.type === 'textarea') {
              html += `<textarea id="${field.name}" name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>`;
            } else if (field.type === 'select' && field.options) {
              html += `
                <select id="${field.name}" name="${field.name}" class="form-select" ${field.required ? 'required' : ''}>
                  <option value="">Sélectionnez une option</option>
              `;
              
              field.options.forEach(option => {
                // Vérifier si option est un objet ou une chaîne de caractères
                if (typeof option === 'string') {
                  html += `<option value="${option}">${option}</option>`;
                } else if (typeof option === 'object') {
                  // S'assurer que la valeur n'est jamais undefined
                  const value = option.value || option.label || option.text || '';
                  const label = option.label || option.text || value;
                  html += `<option value="${value}">${label}</option>`;
                }
              });
              
              html += `</select>`;
            } else {
              html += `
                <input 
                  type="${field.type || 'text'}" 
                  id="${field.name}" 
                  name="${field.name}" 
                  placeholder="${field.placeholder || ''}" 
                  ${field.required ? 'required' : ''}
                >
              `;
            }
            
            html += `</div>`;
          });
          
          html += `
              <button type="submit" class="form-submit">Envoyer</button>
            </form>
          </div>
        `;
        }
        
        // Ajouter le champ de saisie si c'est un élément de type input
        if (message.sender === 'bot' && !message.isTyping && message.type === 'input') {
          const inputType = message.elementData?.inputType || 'text';
          
          html += `
            <div class="inline-input-container" id="input-${message.id}">
              <form class="inline-input-form" data-message-id="${message.id}">
                <div class="inline-input-field">
                  <input 
                    type="${inputType}" 
                    class="inline-input" 
                    placeholder="${message.elementData?.placeholder || `Entrez votre ${inputType === 'email' ? 'email' : inputType === 'number' ? 'numéro' : 'réponse'}...`}" 
                    required
                  >
                  <button type="submit" class="inline-input-submit">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
                <div class="inline-input-error"></div>
              </form>
            </div>
          `;
        }
      }
      
      html += `</div>`;
    });
    
    chatMessages.innerHTML = html;
    
    // Attacher les écouteurs d'événements à chaque message individuellement
    document.querySelectorAll('.message').forEach(messageEl => {
      attachEventListenersToMessage(messageEl);
    });
    
    // Scroll automatique en bas
    scrollToBottom();
  };
  
  // Attacher les écouteurs d'événements aux éléments dynamiques
  const attachEventListeners = () => {
    // Écouteurs pour les boutons d'options
    document.querySelectorAll('.option-button').forEach(button => {
      button.addEventListener('click', handleOptionClick);
    });
    
    // Écouteurs pour les formulaires
    document.querySelectorAll('.inline-form').forEach(form => {
      form.addEventListener('submit', handleFormSubmit);
    });
    
    // Écouteurs pour les champs de saisie inline
    document.querySelectorAll('.inline-input-form').forEach(form => {
      form.addEventListener('submit', handleInlineInputSubmit);
    });
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
            session_id: state.sessionId,
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
  
  // Gérer l'envoi d'un message par l'utilisateur
  const handleSendMessage = () => {
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    
    // Ajouter le message de l'utilisateur
    addMessage({
      id: `user-${Date.now()}`,
      content: messageText,
      type: 'text',
      sender: 'user',
      timestamp: Date.now()
    });
    
    // Effacer le champ de saisie
    messageInput.value = '';
    
    // Trouver le dernier message du bot avec des options
    const lastBotMessage = [...state.messages].reverse().find(
      msg => msg.sender === 'bot' && msg.elementData?.options && msg.elementData.options.length > 0
    );
    
    if (lastBotMessage && lastBotMessage.elementData) {
      // Trouver l'option qui correspond au texte saisi
      const matchedOption = lastBotMessage.elementData.options.find(
        opt => opt.text.toLowerCase() === messageText.toLowerCase()
      );
      
      if (matchedOption && matchedOption.targetNodeId) {
        // Trouver le nœud cible
        const targetNode = state.flowData.nodes.find(node => node.id === matchedOption.targetNodeId);
        if (targetNode) {
          state.currentNodeId = targetNode.id;
          await processNodeElements(targetNode);
        }
      } else {
        // Si aucune option ne correspond, envoyer un message d'erreur
        addMessage({
          id: `bot-${Date.now()}-error`,
          content: "Je n'ai pas compris votre réponse. Veuillez choisir l'une des options proposées.",
          type: 'text',
          sender: 'bot',
          timestamp: Date.now(),
          isTyping: true
        });
        
        // Après un délai, marquer le message comme terminé
        setTimeout(() => {
          state.messages = state.messages.map(msg => {
            if (msg.id === `bot-${Date.now()}-error`) {
              return { ...msg, isTyping: false };
            }
            return msg;
          });
          updateUI();
        }, 1500);
      }
    }
  };
  
  // Réinitialiser la conversation
  const resetChat = async () => {
    // Effacer tous les timeouts
    state.typingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    state.typingTimeouts = [];
    
    // Terminer la session précédente si elle existe
    if (state.sessionId) {
      try {
        await fetch(`${baseUrl}/api/sessions/${state.sessionId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Session terminée:', state.sessionId);
      } catch (error) {
        console.error('Erreur lors de la terminaison de la session:', error);
      }
    }
    
    // Réinitialiser l'état
    state.messages = [];
    state.currentNodeId = null;
    state.selectedOption = null;
    state.sessionId = null;
    state.sessionStartTime = Date.now();
    state.lastNodeTime = Date.now();
    
    // Mettre à jour l'UI
    updateUI();
    
    // Réinitialiser la conversation
    await initializeChat();
  };
  
  // Basculer le thème (clair/sombre)
  const toggleTheme = () => {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark', state.darkMode);
    
    // Mettre à jour l'icône du bouton
    const themeIcon = themeToggle.querySelector('svg');
    if (state.darkMode) {
      themeIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      `;
    } else {
      themeIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      `;
    }
  };
  
  // Faire défiler vers le bas
  const scrollToBottom = () => {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
  };
  
  // Événements
  sendButton.addEventListener('click', handleSendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  });
  
  resetButton.addEventListener('click', resetChat);
  // themeToggle.addEventListener('click', toggleTheme); // supprimé car plus de bouton dark mode
  
  // Charger les données initiales
  await loadFlowData();
});
