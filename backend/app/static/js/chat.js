/**
 * LeadFlow Public Chat Interface
 * Script principal pour l'interface de chat publique
 */

// Configuration initiale
document.addEventListener('DOMContentLoaded', () => {
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
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
  };

  // Appliquer le mode sombre si nécessaire
  if (state.darkMode) {
    document.body.classList.add('dark');
  }

  // Charger les données du flowchart
  const loadFlowData = async () => {
    try {
      state.isLoading = true;
      updateUI();
      
      const response = await fetch(`${baseUrl}/api/assistants/${assistantId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des données');
      
      const data = await response.json();
      state.flowData = {
        nodes: data.nodes || [],
        edges: data.edges || []
      };
      
      state.isLoading = false;
      updateUI();
      
      // Initialiser la conversation
      initializeChat();
    } catch (error) {
      console.error('Erreur:', error);
      state.isLoading = false;
      updateUI();
      
      // Afficher un message d'erreur
      addMessage({
        id: `error-${Date.now()}`,
        content: "Une erreur s'est produite lors du chargement de l'assistant. Veuillez réessayer plus tard.",
        type: 'text',
        sender: 'bot',
        timestamp: Date.now()
      });
    }
  };
  
  // Initialiser la conversation
  const initializeChat = () => {
    if (!state.flowData.nodes.length) return;
    
    // Trouver le nœud de départ
    const startNode = state.flowData.nodes.find(node => node.data?.type === 'start');
    if (startNode) {
      state.currentNodeId = startNode.id;
      
      // Afficher les éléments du nœud de départ
      if (startNode.data?.elements && startNode.data.elements.length > 0) {
        processNodeElements(startNode);
      }
    }
  };
  
  // Traiter les éléments d'un nœud
  const processNodeElements = (node) => {
    if (!node.data?.elements) return;
    
    const processSequentially = (elements, index) => {
      if (index >= elements.length) return;
      
      const element = elements[index];
      const newMessage = {
        id: `bot-${Date.now()}-${index}`,
        content: element.content || '',
        type: element.type,
        sender: 'bot',
        timestamp: Date.now(),
        isTyping: true,
        elementData: element
      };
      
      // Ajouter le message avec animation de frappe
      addMessage(newMessage);
      
      // Après un délai, marquer le message comme terminé
      const typingTimeout = setTimeout(() => {
        state.messages = state.messages.map(msg => {
          if (msg.id === newMessage.id) {
            return { ...msg, isTyping: false };
          }
          return msg;
        });
        updateUI();
        
        // Puis afficher le message suivant
        const nextTimeout = setTimeout(() => {
          processSequentially(elements, index + 1);
        }, 600);
        
        state.typingTimeouts.push(nextTimeout);
      }, 1500 + Math.random() * 800);
      
      state.typingTimeouts.push(typingTimeout);
    };
    
    processSequentially(node.data.elements, 0);
  };
  
  // Ajouter un message à la conversation
  const addMessage = (message) => {
    state.messages.push(message);
    updateUI();
    scrollToBottom();
  };
  
  // Mettre à jour l'interface utilisateur
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
      } else if (message.type === 'image' && message.elementData?.mediaUrl) {
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
      
      // Afficher les options si présentes
      if (message.sender === 'bot' && !message.isTyping && 
          message.elementData?.options && message.elementData.options.length > 0) {
        html += `<div class="options-container">`;
        
        message.elementData.options.forEach((option, index) => {
          const isSelected = state.selectedOption === option.text;
          const selectedClass = isSelected ? 'selected' : '';
          
          html += `
            <button class="option-button ${selectedClass}" data-option="${option.text}" data-message-id="${message.id}">
              ${option.text}
            </button>
          `;
        });
        
        html += `</div>`;
      }
      
      // Afficher le formulaire si c'est un élément de type form
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
              <select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>
                <option value="">Sélectionnez une option</option>
            `;
            
            field.options.forEach(option => {
              html += `<option value="${option.value}">${option.label}</option>`;
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
      
      // Afficher le champ de saisie si c'est un élément de type input
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
      
      html += `</div>`;
    });
    
    chatMessages.innerHTML = html;
    
    // Ajouter les événements pour les options et formulaires
    attachEventListeners();
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
  const handleOptionClick = (event) => {
    const optionText = event.target.dataset.option;
    const messageId = event.target.dataset.messageId;
    
    // Marquer l'option comme sélectionnée
    state.selectedOption = optionText;
    updateUI();
    
    // Trouver le message correspondant
    const message = state.messages.find(msg => msg.id === messageId);
    if (!message || !message.elementData) return;
    
    // Ajouter la réponse de l'utilisateur
    addMessage({
      id: `user-${Date.now()}`,
      content: optionText,
      type: 'text',
      sender: 'user',
      timestamp: Date.now()
    });
    
    // Trouver l'option correspondante
    const matchedOption = message.elementData.options.find(opt => opt.text === optionText);
    if (matchedOption && matchedOption.targetNodeId) {
      // Trouver le nœud cible
      const targetNode = state.flowData.nodes.find(node => node.id === matchedOption.targetNodeId);
      if (targetNode) {
        state.currentNodeId = targetNode.id;
        processNodeElements(targetNode);
      }
    }
    
    // Réinitialiser l'option sélectionnée après un court délai
    setTimeout(() => {
      state.selectedOption = null;
      updateUI();
    }, 500);
  };
  
  // Gérer la soumission d'un formulaire
  const handleFormSubmit = (event) => {
    event.preventDefault();
    
    const form = event.target;
    const messageId = form.dataset.messageId;
    const formData = new FormData(form);
    
    // Convertir les données du formulaire en objet
    const values = {};
    for (const [key, value] of formData.entries()) {
      values[key] = value;
    }
    
    // Trouver le message correspondant
    const message = state.messages.find(msg => msg.id === messageId);
    if (!message || !message.elementData) return;
    
    // Formater les données pour l'affichage
    const formattedContent = Object.entries(values)
      .map(([key, value]) => {
        const field = message.elementData.formFields.find(f => f.name === key);
        const label = field?.label || key;
        return `${label}: ${value}`;
      })
      .join('\n');
    
    // Ajouter la réponse de l'utilisateur
    addMessage({
      id: `user-form-${Date.now()}`,
      content: formattedContent,
      type: 'form',
      sender: 'user',
      timestamp: Date.now(),
      elementData: { formValues: values }
    });
    
    // Passer au nœud suivant
    const nextEdge = state.flowData.edges.find(e => e.source === state.currentNodeId);
    if (nextEdge) {
      const nextNode = state.flowData.nodes.find(n => n.id === nextEdge.target);
      if (nextNode) {
        state.currentNodeId = nextNode.id;
        processNodeElements(nextNode);
      }
    }
  };
  
  // Gérer la soumission d'un champ de saisie inline
  const handleInlineInputSubmit = (event) => {
    event.preventDefault();
    
    const form = event.target;
    const messageId = form.dataset.messageId;
    const input = form.querySelector('.inline-input');
    const errorDiv = form.querySelector('.inline-input-error');
    
    // Valider l'entrée
    const inputValue = input.value.trim();
    const inputType = input.type;
    
    if (!inputValue) {
      errorDiv.textContent = "Ce champ est requis.";
      return;
    }
    
    if (inputType === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inputValue)) {
      errorDiv.textContent = "Veuillez entrer un email valide.";
      return;
    }
    
    if (inputType === 'number' && isNaN(Number(inputValue))) {
      errorDiv.textContent = "Veuillez entrer un nombre valide.";
      return;
    }
    
    // Effacer l'erreur
    errorDiv.textContent = "";
    
    // Trouver le message correspondant
    const message = state.messages.find(msg => msg.id === messageId);
    if (!message || !message.elementData) return;
    
    // Ajouter la réponse de l'utilisateur
    addMessage({
      id: `user-input-${Date.now()}`,
      content: inputValue,
      type: 'input',
      sender: 'user',
      timestamp: Date.now()
    });
    
    // Passer au nœud suivant
    if (message.elementData && message.elementData.options && message.elementData.options[0]?.targetNodeId) {
      const targetNodeId = message.elementData.options[0].targetNodeId;
      const targetNode = state.flowData.nodes.find(n => n.id === targetNodeId);
      if (targetNode) {
        state.currentNodeId = targetNode.id;
        processNodeElements(targetNode);
      }
    } else {
      // Sinon, suivre le flux normal
      const nextEdge = state.flowData.edges.find(e => e.source === state.currentNodeId);
      if (nextEdge) {
        const nextNode = state.flowData.nodes.find(n => n.id === nextEdge.target);
        if (nextNode) {
          state.currentNodeId = nextNode.id;
          processNodeElements(nextNode);
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
          processNodeElements(targetNode);
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
  const resetChat = () => {
    // Effacer les timeouts en cours
    state.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    state.typingTimeouts = [];
    
    // Réinitialiser l'état
    state.messages = [];
    state.currentNodeId = null;
    state.selectedOption = null;
    
    updateUI();
    
    // Réinitialiser la conversation
    initializeChat();
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
  loadFlowData();
});
