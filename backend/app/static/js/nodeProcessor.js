/**
 * Fonctions pour le traitement des nœuds du flow
 */
import { state, addMessage, updateMessage } from './state.js';
import { baseUrl } from './config.js';
import { trackMessage } from './eventHandlers.js';

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
    
    // TRACKING SYSTEMATIQUE DE LA QUESTION (si présente)
    if (node.question) {
      await trackMessage(state.sessionId, node.question, true, node.type || 'text', node.id);
    } else if (node.data && node.data.elements && node.data.elements.length) {
      // Si la question est dans le premier élément
      const firstElement = node.data.elements[0];
      if (firstElement.content) {
        await trackMessage(state.sessionId, firstElement.content, true, firstElement.type || 'text', node.id);
      }
    }
    // Vérifier si c'est un nœud de type END
    console.log('Vérification du type de nœud:', node.type, node.data?.type);
    if (node.type === 'end' || node.data?.type === 'end') {
      console.log('🏁 Nœud de fin détecté! Terminaison de la session...');
      try {
        const response = await fetch(`${baseUrl}/api/sessions/${state.sessionId}/end`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('✅ Session terminée avec succès!');
        } else {
          console.error('❌ Erreur lors de la terminaison de la session:', response.status);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la terminaison de la session:', error);
      }
    }
  }
  
  // Traiter chaque élément du nœud séquentiellement
  for (let i = 0; i < node.data.elements.length; i++) {
    const element = node.data.elements[i];
    
    // Si c'est un formulaire avec une description, afficher d'abord la description comme message distinct
    if (element.type === 'form' && element.formDescription) {
      // Ajouter un message avec la description du formulaire
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
      
      // Simuler le temps de frappe pour la description
      const descTypingTime = Math.max(500, element.formDescription.length * 10);
      await new Promise(resolve => setTimeout(resolve, descTypingTime));
      
      // Mettre à jour le message avec la description
      updateMessage(descriptionMessageId, {
        content: element.formDescription,
        isTyping: false
      });
      
      // Attendre un moment avant d'afficher le formulaire
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      // Marquer l'élément pour ne pas afficher la description dans le formulaire
      element.formDescriptionAsMessage = true;
    }
    
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

// Trouver le nœud suivant dans le flow
const findNextNode = (currentNodeId) => {
  if (!currentNodeId || !state.flowData) return null;
  
  const outgoingEdge = state.flowData.edges.find(edge => edge.source === currentNodeId);
  if (!outgoingEdge) return null;
  
  return state.flowData.nodes.find(node => node.id === outgoingEdge.target);
};

// Exporter les fonctions
export { processNodeElements, findNextNode };
