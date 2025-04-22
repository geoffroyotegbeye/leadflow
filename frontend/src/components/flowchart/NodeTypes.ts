export type ElementType = {
  id: string;
  type: 'text' | 'question' | 'input' | 'api_call' | 'wait_input' | 'form' | 'image' | 'video' | 'file' | 'carousel' | 'quick_replies' | 'location' | 'audio' | 'document';
  content: string;
  displayMode: 'after' | 'simultaneous';
  inputType?: 'text' | 'email' | 'number'; // Pour l'entrée libre
  options?: OptionType[]; // Pour les questions
  apiConfig?: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  };
  formFields?: {
    type: 'text' | 'email' | 'number' | 'tel' | 'date' | 'select' | 'checkbox' | 'radio';
    label: string;
    required?: boolean;
    options?: string[];
  }[];
  formDescription?: string; // Description du formulaire
  mediaUrl?: string;
  mediaType?: string;
  carouselItems?: {
    title: string;
    description?: string;
    imageUrl?: string;
    buttons?: {
      label: string;
      action: 'url' | 'postback';
      value: string;
    }[];
  }[];
};

export type OptionType = {
  id: string;
  text: string;
  targetNodeId?: string;
};

export type NodeData = {
  id: string;
  label: string;
  type?: string;
  elements: ElementType[];
  position?: { x: number; y: number };
};

export enum NodeType {
  START = 'start',
  INTERACTION = 'interaction',
  CONDITION = 'condition',
  ACTION = 'action',
  END = 'end'
}

export const ELEMENT_TYPES = {
  text: {
    label: 'Message texte',
    description: 'Envoyer une information',
    icon: 'ChatBubbleLeftRightIcon',
  },
  question: {
    label: 'Question à choix',
    description: 'Choix parmi des options',
    icon: 'QuestionMarkCircleIcon',
  },
  input: {
    label: 'Entrée libre',
    description: 'Demande une réponse simple',
    icon: 'EnvelopeIcon',
  },
  api_call: {
    label: 'Appel API',
    description: 'Appeler un service externe'
  },
  wait_input: {
    label: 'Attente réponse',
    description: 'Attendre une réponse de l\'utilisateur'
  },
  form: {
    label: 'Formulaire',
    description: 'Plusieurs champs à remplir'
  },
  image: {
    label: 'Image',
    description: 'Envoyer une image ou une photo'
  },
  video: {
    label: 'Vidéo',
    description: 'Partager une vidéo'
  },
  carousel: {
    label: 'Carrousel',
    description: 'Afficher un carrousel de cartes avec images et boutons'
  },
  quick_replies: {
    label: 'Réponses rapides',
    description: 'Proposer des boutons de réponse rapide'
  },
  location: {
    label: 'Localisation',
    description: 'Demander ou partager une localisation'
  },
  document: {
    label: 'Document',
    description: 'Partager un document ou un fichier'
  },
  audio: {
    label: 'Audio',
    description: 'Partager un fichier audio'
  },
  file: {
    label: 'Fichier',
    description: 'Partager un fichier'
  }
};

export const NODE_TYPES: Record<string, { label: string; color: string; icon: string }> = {
  start: {
    label: 'Début',
    color: '#10B981',
    icon: 'PlayIcon'
  },
  interaction: {
    label: 'Interaction',
    color: '#3B82F6',
    icon: 'ChatBubbleLeftRightIcon'
  },
  condition: {
    label: 'Condition',
    color: '#F59E0B',
    icon: 'ArrowPathRoundedSquareIcon'
  },
  action: {
    label: 'Action',
    color: '#6366F1',
    icon: 'BoltIcon'
  },
  end: {
    label: 'Fin',
    color: '#EF4444',
    icon: 'StopIcon'
  }
};
