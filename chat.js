/**
 * LeadFlow Public Chat Interface
 * Script principal pour linterface de chat publique
 **/

// Configuration initiale
document.addEventListener('DOMContentLoaded', async () => {
  // Initialisation des variables
  const chatMessages = document.getElementById('chat-messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const resetButton = document.getElementById('reset-button');
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

  // Fonction pour générer le HTML des messages
  const generateMessageHTML = (message) => {
    const isBot = message.sender === 'bot';
    const senderClass = isBot ? 'message-bot' : 'message-user';
    const typingClass = message.isTyping ? 'typing' : '';
    const messageId = message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let html = `<div class="message ${senderClass} ${typingClass}" data-id="${messageId}">`;
    
    if (isBot && !message.isTyping) {
      html += `
        <div class="message-header">
          <div class="bot-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16" />
              <line x1="16" y1="16" x2="16" y2="16" />
            </svg>
          </div>
          <div class="bot-name">Assistant</div>
        </div>
      `;
    }
    
    html += `<div class="message-content ${senderClass}-content">`;
    
    if (message.isTyping) {
      html += `
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      `;
    } else if (message.type === 'options' && message.elementData?.options) {
      html += `<div class="options-container">`;
      message.elementData.options.forEach(opt => {
        html += `
          <button class="option-button" data-option="${opt.text}" data-message-id="${messageId}">
            ${opt.text}
          </button>
        `;
      });
      html += `</div>`;
    } else {
      html += `<span>${message.content}</span>`;
    }
    
    html += `</div></div>`;
    return html;
  };

  // Attacher les écouteurs d'événements aux messages
  const attachEventListenersToMessage = (messageEl) => {
    const optionButtons = messageEl.querySelectorAll('.option-button');
    optionButtons.forEach(button => {
      button.addEventListener('click', handleOptionClick);
    });
  };

  // Mettre à jour l'interface utilisateur
  const updateUI = () => {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = state.isLoading ? 'flex' : 'none';
    }
    
    if (chatMessages) {
      chatMessages.innerHTML = '';
      state.messages.forEach(message => {
        const messageHTML = generateMessageHTML(message);
        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        const messageEl = chatMessages.lastElementChild;
        if (messageEl) {
          messageEl.classList.add('new-message');
          attachEventListenersToMessage(messageEl);
        }
      });
      scrollToBottom();
    }
  };

  // Ajouter un message
  const addMessage = (message) => {
    state.messages.push(message);
    updateUI();
  };

  // Gérer le clic sur une option
  const handleOptionClick = async (event) => {
    const button = event.currentTarget;
    const option = button.dataset.option;
    const messageId = button.dataset.messageId;
    
    if (!option || !messageId) return;
    
    const message = state.messages.find(msg => msg.id === messageId);
    if (!message || !message.elementData || !message.elementData.options) return;
    
    state.selectedOption = option;
    
    const optionButtons = document.querySelectorAll(`.option-button[data-message-id="${messageId}"]`);
    optionButtons.forEach(btn => {
      if (btn.dataset.option === option) {
        btn.classList.add('selected');
      } else {
        btn.classList.add('not-selected');
      }
      btn.disabled = true;
    });
    
    addMessage({
      id: `user-${Date.now()}`,
      content: option,
      type: 'option',
      sender: 'user',
      timestamp: Date.now()
    });
    
    if (state.sessionId) {
      try {
        if (message.content && message.nodeId) {
          await fetch(`${baseUrl}/api/analytics/track_message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: state.sessionId,
              content: message.content,
              is_question: true,
              message_type: message.type || 'option',
              node_id: message.nodeId
            })
          });
        }
        await fetch(`${baseUrl}/api/analytics/track_message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: state.sessionId,
            content: option,
            is_question: false,
            message_type: 'option',
            node_id: message.nodeId
          })
        });
      } catch (err) {
        console.error('Erreur lors du tracking du message:', err);
      }
    }
    
    const optionIndex = message.elementData.options.findIndex(opt => opt.text === option);
    if (optionIndex === -1) return;
    
    const questionId = message.elementData.id;
    const sourceHandle = `option-${questionId}-${optionIndex}`;
    
    const nextEdge = state.flowData.edges.find(
      edge => edge.source === state.currentNodeId && edge.sourceHandle === sourceHandle
    );
    
    if (nextEdge) {
      const targetNode = state.flowData.nodes.find(node => node.id === nextEdge.target);
      if (targetNode) {
        state.currentNodeId = targetNode.id;
        await processNodeElements(targetNode);
        return;
      }
    }
    
    console.warn(`Aucune edge trouvée pour sourceHandle : ${sourceHandle}`);
  };

  // Charger les données du flow
  const loadFlowData = async () => {
    state.isLoading = true;
    updateUI();
    
    try {
      const response = await fetch(`${baseUrl}/api/assistants/${assistantId}/flow`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const data = await response.json();
      state.flowData = data;
      state.isLoading = false;
      updateUI();
      await initializeChat();
    } catch (error) {
      console.error('Erreur lors du chargement du flow:', error);
      addMessage({
        id: `error-${Date.now()}`,
        content: "Erreur: Impossible de charger les données. Veuillez réessayer.",
        type: 'text',
        sender: 'bot',
        timestamp: Date.now()
      });
    }
  };
  
  // Initialiser la conversation
  const initializeChat = async () => {
    const startNode = state.flowData.nodes.find(node => {
      if (node.type === 'startNode') return true;
      return !state.flowData.edges.some(edge => edge.target === node.id);
    });
    
    if (startNode) {
      state.currentNodeId = startNode.id;
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
    
    for (let i = 0; i < node.data.elements.length; i++) {
      const element = node.data.elements[i];
      if (element.type === 'form' && element.formDescription) {
        const descriptionMessageId = `bot-desc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        addMessage({
          id: descriptionMessageId,
          nodeId: node.id,
          content: '',
          type: 'text',
          sender: 'bot',
          timestamp: Date.now(),
          isTyping: true,
          elementData: { content: element.formDescription }
        });
        const descTypingTime = Math.max(500, element.formDescription.length * 10);
        await new Promise(resolve => setTimeout(resolve, descTypingTime));
        state.messages = state.messages.map(msg => {
          if (msg.id === descriptionMessageId) {
            return { ...msg, content: element.formDescription, isTyping: false };
          }
          return msg;
        });
        updateUI();
        await new Promise(resolve => setTimeout(resolve, 1800));
        element.formDescriptionAsMessage = true;
      }
      
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
      
      const typingTime = Math.max(500, element.content ? element.content.length * 10 : 500);
      await new Promise(resolve => setTimeout(resolve, typingTime));
      
      state.messages = state.messages.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, content: element.content || '', isTyping: false };
        }
        return msg;
      });
      updateUI();
      
      if (
        (element.type === 'options' && element.options && element.options.length > 0) ||
        (element.type === 'form' && element.formFields && element.formFields.length > 0) ||
        (element.type === 'input')
      ) {
        break;
      }
    }
  };
  
  // Gérer l'envoi d'un message par l'utilisateur
  const handleSendMessage = async () => {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    
    if (!messageText) return;
    
    addMessage({
      id: `user-${Date.now()}`,
      content: messageText,
      type: 'text',
      sender: 'user',
      timestamp: Date.now()
    });
    
    messageInput.value = '';
    
    const lastBotMessage = [...state.messages].reverse().find(
      msg => msg.sender === 'bot' && msg.elementData?.options && msg.elementData.options.length > 0
    );
    
    if (lastBotMessage && lastBotMessage.elementData) {
      const optionIndex = lastBotMessage.elementData.options.findIndex(
        opt => opt.text.toLowerCase() === messageText.toLowerCase()
      );
      
      if (optionIndex !== -1) {
        const questionId = lastBotMessage.elementData.id;
        const sourceHandle = `option-${questionId}-${optionIndex}`;
        
        console.log('handleSendMessage:', { messageText, optionIndex, sourceHandle });
        
        const nextEdge = state.flowData.edges.find(
          edge => edge.source === state.currentNodeId && edge.sourceHandle === sourceHandle
        );
        
        if (nextEdge) {
          const targetNode = state.flowData.nodes.find(node => node.id === nextEdge.target);
          if (targetNode) {
            state.currentNodeId = targetNode.id;
            await processNodeElements(targetNode);
            return;
          }
        }
        
        console.warn(`Aucune edge trouvée pour sourceHandle : ${sourceHandle}`);
      }
      
      addMessage({
        id: `bot-${Date.now()}-error`,
        content: "Je n'ai pas compris votre réponse. Veuillez choisir l'une des options proposées.",
        type: 'text',
        sender: 'bot',
        timestamp: Date.now(),
        isTyping: true
      });
      
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
  };
  
  // Réinitialiser la conversation
  const resetChat = async () => {
    state.typingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    state.typingTimeouts = [];
    
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
    
    state.messages = [];
    state.currentNodeId = null;
    state.selectedOption = null;
    state.sessionId = null;
    state.sessionStartTime = Date.now();
    state.lastNodeTime = Date.now();
    
    updateUI();
    await initializeChat();
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
  
  // Charger les données initiales
  await loadFlowData();
});