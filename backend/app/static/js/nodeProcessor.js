/**
 * Fonctions pour le traitement des nœuds du flow
 */
import { state, addMessage, updateMessage } from './state.js';
import { baseUrl } from './config.js';

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

// Trouver le nœud suivant dans le flow
const findNextNode = (currentNodeId) => {
  if (!currentNodeId || !state.flowData) return null;
  
  const outgoingEdge = state.flowData.edges.find(edge => edge.source === currentNodeId);
  if (!outgoingEdge) return null;
  
  return state.flowData.nodes.find(node => node.id === outgoingEdge.target);
};

// Exporter les fonctions
export { processNodeElements, findNextNode };
