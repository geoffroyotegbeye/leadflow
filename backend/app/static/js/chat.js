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
  const loadFlowData = () => {
    state.isLoading = true;
    updateUI();
    
    // Récupérer les données du flow depuis l'API
    fetch(`${baseUrl}/api/assistants/${assistantId}/flow`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données');
        }
        return response.json();
      })
      .then(data => {
        state.flowData = data;
        state.isLoading = false;
        updateUI();
        
        // Initialiser la conversation
        initializeChat();
      })
      .catch(error => {
        console.error('Erreur:', error);
        state.isLoading = false;
        updateUI();
        
        // Afficher un message d'erreur
        addMessage({
          id: `error-${Date.now()}`,
          content: "Erreur: Impossible de charger les données. Veuillez réessayer plus tard.",
          type: 'text',
          sender: 'bot',
          timestamp: Date.now()
        });
      });
  };
  
  // Initialiser la conversation
  const initializeChat = async () => {
    // Créer une session pour cette conversation
    try {
      const response = await fetch(`${baseUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistant_id: assistantId,
          user_info: state.userInfo
        })
      });
      
      if (!response.ok) throw new Error('Erreur lors de la création de la session');
      
      const sessionData = await response.json();
      state.sessionId = sessionData.id;
      state.sessionStartTime = Date.now();
      console.log('Session créée:', state.sessionId);
      
      // Trouver le nœud de départ
      const startNode = state.flowData.nodes.find(node => node.type === 'start');
      
      if (startNode) {
        state.currentNodeId = startNode.id;
        await processNodeElements(startNode);
      } else {
        addMessage({
          id: `error-${Date.now()}`,
          content: "Erreur: Impossible de trouver le nœud de départ.",
          type: 'text',
          sender: 'bot',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du chat:', error);
      addMessage({
        id: `error-${Date.now()}`,
        content: "Erreur: Impossible d'initialiser la conversation. Veuillez réessayer plus tard.",
        type: 'text',
        sender: 'bot',
        timestamp: Date.now()
      });
    }
  };
  
  // Traiter les éléments d'un nœud
  const processNodeElements = async (node) => {
    if (!node || !node.data) return;
    
    const { elements } = node.data;
    
    if (!elements || !Array.isArray(elements)) {
      console.error('Aucun élément trouvé dans le nœud:', node);
      return;
    }
    
    // Enregistrer le temps passé sur le nœud précédent
    const timeSpentOnPreviousNode = Date.now() - state.lastNodeTime;
    state.lastNodeTime = Date.now();
    
    // Envoyer un message au backend pour indiquer que nous sommes sur ce nœud
    if (state.sessionId && node.id) {
      try {
        await fetch(`${baseUrl}/api/sessions/${state.sessionId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: state.sessionId,
            sender: 'bot',
            content: 'node_visit',
            content_type: 'system',
            node_id: node.id,
            metadata: {
              time_spent_on_previous_node: timeSpentOnPreviousNode,
              node_type: node.type,
              timestamp: Date.now()
            }
          })
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la visite du nœud:', error);
      }
    }
    
    // Traiter chaque élément du nœud séquentiellement
    let delay = 0;
    const delayIncrement = 1000; // Délai entre chaque message
    
    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      await new Promise(resolve => {
        setTimeout(async () => {
          const messageId = `bot-${Date.now()}-${index}`;
          
          // Ajouter le message avec l'état "typing"
          addMessage({
            id: messageId,
            content: element.content || '',
            type: element.type || 'text',
            sender: 'bot',
            timestamp: Date.now(),
            elementData: element,
            isTyping: true,
            nodeId: node.id
          });
          
          // Simuler le temps de frappe
          const typingDelay = Math.max(1000, (element.content?.length || 0) * 20);
          
          const timeoutId = setTimeout(async () => {
            // Mettre à jour le message pour indiquer que la frappe est terminée
            state.messages = state.messages.map(msg => {
              if (msg.id === messageId) {
                return { ...msg, isTyping: false };
              }
              return msg;
            });
            
            updateUI();
            
            // Envoyer le message au backend pour les analytics
            if (state.sessionId) {
              try {
                await fetch(`${baseUrl}/api/sessions/${state.sessionId}/messages`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    session_id: state.sessionId,
                    sender: 'bot',
                    content: element.content || '',
                    content_type: element.type || 'text',
                    node_id: node.id,
                    metadata: {
                      element_type: element.type,
                      timestamp: Date.now()
                    }
                  })
                });
              } catch (error) {
                console.error('Erreur lors de l\'enregistrement du message:', error);
              }
            }
            
            resolve();
          }, typingDelay);
          
          state.typingTimeouts.push(timeoutId);
        }, delay);
        
        delay += delayIncrement;
      });
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
            const optionValue = typeof option === 'string' ? option : (option.value || option.text || option);
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
  
  // Attacher les écouteurs d'événements aux éléments d'un message
  const attachEventListenersToMessage = (messageEl) => {
    // Attacher les écouteurs aux boutons d'options
    const optionButtons = messageEl.querySelectorAll('.option-button');
    optionButtons.forEach(button => {
      button.addEventListener('click', handleOptionClick);
    });
    
    // Attacher les écouteurs aux formulaires
    const forms = messageEl.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', handleFormSubmit);
    });
    
    // Attacher les écouteurs aux champs de saisie
    const inputFields = messageEl.querySelectorAll('.input-field');
    inputFields.forEach(input => {
      input.addEventListener('keypress', handleInputKeypress);
    });
    
    // Attacher les écouteurs aux boutons d'envoi des champs de saisie
    const inputSubmitButtons = messageEl.querySelectorAll('.input-submit-button');
    inputSubmitButtons.forEach(button => {
      button.addEventListener('click', handleInputSubmit);
    });
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
              ${option.imageUrl ? `<img src="${option.imageUrl}" alt="${option.text || `Option ${index+1}`}" onerror="this.src='https://via.placeholder.com/80?text=Error'">` : ''}
              <span>${option.text}</span>
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
    // Récupérer le bouton parent si l'utilisateur a cliqué sur un élément à l'intérieur du bouton
    const button = event.target.closest('.option-button');
    if (!button) return;
    
    const optionText = button.dataset.option;
    const messageId = button.dataset.messageId;
    
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
    let matchedOption;
    
    // Vérifier les différentes structures d'options possibles
    if (message.elementData.options) {
      // Cas 1: options est un tableau d'objets avec propriété 'text'
      matchedOption = message.elementData.options.find(opt => typeof opt === 'object' && opt.text === optionText);
      
      // Cas 2: options est un tableau d'objets avec propriété 'label'
      if (!matchedOption) {
        matchedOption = message.elementData.options.find(opt => typeof opt === 'object' && opt.label === optionText);
      }
      
      // Cas 3: options est un tableau de chaînes
      if (!matchedOption) {
        const index = message.elementData.options.findIndex(opt => typeof opt === 'string' && opt === optionText);
        if (index >= 0) {
          // Créer un objet option factice avec l'index comme targetNodeId
          matchedOption = { text: optionText };
          
          // Chercher si un targetNodeId est défini ailleurs dans l'objet message
          if (message.elementData.targetNodeIds && message.elementData.targetNodeIds[index]) {
            matchedOption.targetNodeId = message.elementData.targetNodeIds[index];
          }
        }
      }
    }
    
    // Si une option correspondante est trouvée et a un targetNodeId
    if (matchedOption && matchedOption.targetNodeId) {
      // Trouver le nœud cible
      const targetNode = state.flowData.nodes.find(node => node.id === matchedOption.targetNodeId);
      if (targetNode) {
        state.currentNodeId = targetNode.id;
        await processNodeElements(targetNode);
      }
    } else {
      // Sinon, suivre le flux normal (premier edge sortant)
      const nextEdge = state.flowData.edges.find(e => e.source === state.currentNodeId);
      if (nextEdge) {
        const nextNode = state.flowData.nodes.find(n => n.id === nextEdge.target);
        if (nextNode) {
          state.currentNodeId = nextNode.id;
          await processNodeElements(nextNode);
        }
      }
    }
    
    // Réinitialiser l'option sélectionnée après un court délai
    setTimeout(() => {
      state.selectedOption = null;
      updateUI();
    }, 500);
  };
  
  // Gérer la soumission d'un formulaire
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const messageId = form.dataset.messageId;
    const targetNodeId = form.dataset.target;
    const message = state.messages.find(msg => msg.id === messageId);
    
    // Collecter les données du formulaire
    const formData = new FormData(form);
    const formValues = {};
    let formContent = '';
    
    for (const [name, value] of formData.entries()) {
      formValues[name] = value;
      formContent += `${name}: ${value}\n`;
    }
    
    // Ajouter la réponse de l'utilisateur
    addMessage({
      id: `user-${Date.now()}`,
      content: formContent,
      type: 'form_response',
      sender: 'user',
      timestamp: Date.now(),
      elementData: { formValues }
    });
    
    // Désactiver le formulaire
    form.querySelectorAll('input, textarea, select, button').forEach(el => {
      el.disabled = true;
    });
    
    // Envoyer les données du formulaire au backend pour les analytics
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
            content: formContent,
            content_type: 'form',
            node_id: message?.nodeId,
            metadata: {
              form_values: formValues,
              target_node_id: targetNodeId,
              timestamp: Date.now()
            }
          })
        });
        
        // Enregistrer chaque champ du formulaire individuellement pour les analytics
        for (const [name, value] of Object.entries(formValues)) {
          await fetch(`${baseUrl}/api/sessions/${state.sessionId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              session_id: state.sessionId,
              sender: 'user',
              content: value,
              content_type: 'form_field',
              node_id: message?.nodeId,
              metadata: {
                field_name: name,
                field_value: value,
                timestamp: Date.now()
              }
            })
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement des données du formulaire:', error);
      }
    }
    
    // Trouver le nœud cible et traiter ses éléments
    if (targetNodeId) {
      const targetNode = state.flowData.nodes.find(node => node.id === targetNodeId);
      if (targetNode) {
        state.currentNodeId = targetNode.id;
        await processNodeElements(targetNode);
      }
    }
  };
  
  // Gérer la soumission d'un champ de saisie inline
  const handleInlineInputSubmit = async (event) => {
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
      const targetNode = state.flowData.nodes.find(node => node.id === targetNodeId);
      if (targetNode) {
        state.currentNodeId = targetNode.id;
        await processNodeElements(targetNode);
      }
    } else {
      // Sinon, suivre le flux normal
      const nextEdge = state.flowData.edges.find(e => e.source === state.currentNodeId);
      if (nextEdge) {
        const nextNode = state.flowData.nodes.find(n => n.id === nextEdge.target);
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
  loadFlowData();
});
