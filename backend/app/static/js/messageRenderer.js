/**
 * Fonctions pour le rendu des messages dans l'interface
 */
import { state } from './state.js';

// Générer le HTML pour un message
const generateMessageHTML = (message) => {
  const isBot = message.sender === 'bot';
  const senderClass = isBot ? 'bot' : 'user';
  const typingClass = message.isTyping ? 'typing' : '';
  const messageId = message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  let classes = 'message';
  if (message.sender === 'user') {
    classes += ' message-user';
  } else {
    classes += ' message-bot';
  }
  
  let html = `
    <div class="${classes} ${senderClass} ${typingClass}" data-id="${messageId}">
  `;
  
  // Afficher l'en-tête du bot uniquement pour le premier message ou après un message utilisateur
  if (isBot) {
    const showBotHeader = shouldShowBotHeader(message);
    
    if (showBotHeader) {
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
  }
  
  html += `<div class="message-content ${senderClass}-content">`;
  
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
      html += generateOptionsHTML(message);
    }
    
    // Ajouter le formulaire si c'est un élément de type form
    if (message.sender === 'bot' && !message.isTyping && message.type === 'form' && 
        message.elementData?.formFields && message.elementData.formFields.length > 0) {
      html += generateFormHTML(message);
    }
    
    // Ajouter le champ de saisie si c'est un élément de type input
    if (message.sender === 'bot' && !message.isTyping && message.type === 'input') {
      html += generateInputHTML(message);
    }
  }
  
  html += `</div>`;
  html += `</div>`;
  
  return html;
};

// Déterminer si l'en-tête du bot doit être affiché
const shouldShowBotHeader = (message) => {
  const index = state.messages.findIndex(msg => msg.id === message.id);
  if (index <= 0) return true;
  
  const previousMessage = state.messages[index - 1];
  return previousMessage.sender !== 'bot';
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

// Générer le HTML pour un formulaire
const generateFormHTML = (message) => {
  let formHTML = `
    <div class="form-container" id="form-${message.id}">
      <form class="inline-form" data-message-id="${message.id}">
  `;
  
  // Afficher la description du formulaire uniquement si elle n'a pas déjà été affichée comme message
  if (message.elementData.formDescription && !message.elementData.formDescriptionAsMessage) {
    formHTML += `
      <div class="form-header">
        <h3 class="form-title">Veuillez compléter ce formulaire</h3>
        <p class="form-description">${message.elementData.formDescription}</p>
      </div>
    `;
  } else {
    formHTML += `
      <div class="form-header">
        <h3 class="form-title">Veuillez compléter ce formulaire</h3>
      </div>
    `;
  }
  
  message.elementData.formFields.forEach((field, index) => {
    const fieldId = `field-${message.id}-${index}`;
    const isRequired = field.required ? 'required' : '';
    
    formHTML += `
      <div class="form-field">
        <label for="${fieldId}">${field.label || field.name}</label>
    `;
    
    if (field.type === 'textarea') {
      formHTML += `<textarea id="${fieldId}" name="${field.name || field.id || fieldId}" placeholder="${field.placeholder || ''}" ${isRequired}></textarea>`;
    } else if (field.type === 'select') {
      const options = field.options || [];
      formHTML += `
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
      `;
    } else {
      formHTML += `
        <input 
          type="${field.type || 'text'}" 
          id="${fieldId}" 
          name="${field.name || field.id || fieldId}" 
          placeholder="${field.placeholder || ''}" 
          ${isRequired}
        >
      `;
    }
    
    formHTML += `</div>`;
  });
  
  formHTML += `
        <div class="form-error"></div>
        <button type="submit" class="form-submit">Envoyer</button>
      </form>
    </div>
  `;
  
  return formHTML;
};

// Générer le HTML pour un champ de saisie inline
const generateInputHTML = (message) => {
  const inputType = message.elementData?.inputType || 'text';
  
  return `
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
};

// Générer le HTML pour les éléments médias (images, vidéos, audio)
const generateMediaHTML = (message) => {
  if (!message.elementData || !message.elementData.mediaUrl) return '';
  
  let mediaHTML = '<div class="media-container">';
  
  if (message.type === 'image') {
    mediaHTML += `
      <img 
        src="${message.elementData.mediaUrl}" 
        alt="${message.content || 'Image'}" 
        onerror="this.src='https://via.placeholder.com/400x300?text=Image+non+disponible'"
      >
    `;
  } else if (message.type === 'video') {
    mediaHTML += `
      <video src="${message.elementData.mediaUrl}" controls></video>
    `;
  } else if (message.type === 'audio') {
    mediaHTML += `
      <audio src="${message.elementData.mediaUrl}" controls></audio>
    `;
  }
  
  if (message.content) {
    mediaHTML += `<div class="media-caption">${message.content}</div>`;
  }
  
  mediaHTML += '</div>';
  return mediaHTML;
};

// Exporter les fonctions
export { 
  generateMessageHTML, 
  generateOptionsHTML, 
  generateFormHTML, 
  generateInputHTML, 
  generateMediaHTML 
};
