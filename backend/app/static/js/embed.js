/**
 * Script d'intégration pour les assistants LeadFlow
 * Ce script permet d'intégrer un assistant LeadFlow sur n'importe quel site web
 * Version 2.0 - Utilise une iframe pour charger l'expérience complète de chat
 */

(function() {
    // Récupérer les attributs du script
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    const assistantId = currentScript.getAttribute('data-assistant-id');
    const baseUrl = currentScript.getAttribute('data-base-url');
    const theme = currentScript.getAttribute('data-theme') || 'auto';
    const height = currentScript.getAttribute('data-height') || '600px';
    const width = currentScript.getAttribute('data-width') || '100%';
    
    if (!assistantId || !baseUrl) {
        console.error('LeadFlow Assistant: Les attributs data-assistant-id et data-base-url sont requis');
        return;
    }
    
    // Créer le conteneur du chat
    const containerId = `leadflow-assistant-${assistantId}`;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`LeadFlow Assistant: Le conteneur avec l'ID ${containerId} n'a pas été trouvé`);
        return;
    }
    
    // Styles pour le widget de chat
    const styles = `
        .leadflow-embed-container {
            width: ${width};
            height: ${height};
            max-width: 100%;
            overflow: hidden;
            position: relative;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .leadflow-embed-iframe {
            width: 100%;
            height: 100%;
            border: none;
            overflow: hidden;
        }
        
        .leadflow-embed-loading {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #f9f9f9;
            color: #333;
            z-index: 2;
            transition: opacity 0.5s ease-out;
        }
        
        .leadflow-embed-loading.dark {
            background-color: #1f2937;
            color: #f3f4f6;
        }
        
        .leadflow-spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #4a6cf7;
            animation: leadflow-spin 1s linear infinite;
            margin-bottom: 15px;
        }
        
        .dark .leadflow-spinner {
            border-color: rgba(255, 255, 255, 0.1);
            border-left-color: #4a6cf7;
        }
        
        @keyframes leadflow-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .leadflow-powered-by {
            font-size: 11px;
            text-align: center;
            margin-top: 10px;
            color: #666;
            font-family: Arial, sans-serif;
        }
        
        .leadflow-powered-by a {
            color: #4a6cf7;
            text-decoration: none;
        }
    `;
    
    // Injecter les styles
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    
    // Déterminer si le mode sombre est actif
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = theme === 'dark' || (theme === 'auto' && prefersDarkMode);
    
    // Créer le bouton flottant (toujours visible en bas à droite)
    const chatButton = document.createElement('button');
    chatButton.setAttribute('aria-label', 'Ouvrir le chat LeadFlow');
    chatButton.className = 'leadflow-chat-fab';
    chatButton.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    `;
    chatButton.style.zIndex = '2147483647';
    chatButton.style.position = 'fixed';
    chatButton.style.bottom = '24px';
    chatButton.style.right = '24px';
    document.body.appendChild(chatButton);

    // Créer la modale cachée
    const modal = document.createElement('div');
    modal.className = 'leadflow-chat-modal';
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="leadflow-chat-modal-content">
            <button class="leadflow-chat-close" aria-label="Fermer le chat">&times;</button>
            <iframe 
                class="leadflow-embed-iframe" 
                src="${baseUrl}/api/assistants/public/${assistantId}" 
                title="LeadFlow Assistant" 
                allow="microphone" 
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms"
            ></iframe>
        </div>

    `;
    document.body.appendChild(modal);

    // Ouvrir la modale au clic
    chatButton.addEventListener('click', () => {
        modal.style.display = 'flex';
        document.body.classList.add('leadflow-modal-open');
    });
    // Fermer la modale
    modal.querySelector('.leadflow-chat-close').addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.classList.remove('leadflow-modal-open');
    });
    // Fermer si clic à l'extérieur du contenu
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.classList.remove('leadflow-modal-open');
        }
    });

    // Styles pour le bouton et la modale
    const fabStyles = `
    .leadflow-chat-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        background: #4a6cf7;
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }
    .leadflow-chat-fab:hover {
        background: #3554c7;
    }
    .leadflow-chat-fab svg {
        display: block;
        width: 28px;
        height: 28px;
    }
    .leadflow-chat-modal {
        position: fixed;
        z-index: 2147483647;
        top: 0; left: 0; right: 0; bottom: 0;
        display: none;
        align-items: flex-end;
        justify-content: flex-end;
        background: rgba(0,0,0,0.15);
        transition: background 0.2s;
    }
    .leadflow-chat-modal-content {
        position: relative;
        background: #fff;
        border-radius: 16px 16px 0 0;
        width: 100%;
        max-width: 380px;
        height: 82vh;
        min-height: 420px;
        margin: 0 12px 12px 0;
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: leadflow-modal-in 0.25s;
    }
    .leadflow-chat-close {
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: none;
        font-size: 2rem;
        color: #888;
        cursor: pointer;
        z-index: 2;
        line-height: 1;
    }
    .leadflow-embed-iframe {
        flex: 1;
        width: 100%;
        border: none;
        min-height: 320px;
        border-radius: 0 0 16px 16px;
        background: #f9f9f9;
    }
    .leadflow-powered-by {
        font-size: 11px;
        text-align: center;
        margin: 10px 0 0 0;
        color: #666;
        font-family: Arial, sans-serif;
    }
    .leadflow-powered-by a {
        color: #4a6cf7;
        text-decoration: none;
    }
    @keyframes leadflow-modal-in {
        0% { transform: translateY(100%); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
    }
    @media (max-width: 600px) {
        .leadflow-chat-modal-content {
            max-width: 100vw;
            width: 100vw;
            height: 100vh;
            min-height: 100vh;
            border-radius: 0;
            margin: 0;
        }
        .leadflow-embed-iframe {
            border-radius: 0;
        }
    }
    .leadflow-modal-open {
        overflow: hidden !important;
    }
    `;
    const styleFab = document.createElement('style');
    styleFab.textContent = fabStyles;
    document.head.appendChild(styleFab);

})();
