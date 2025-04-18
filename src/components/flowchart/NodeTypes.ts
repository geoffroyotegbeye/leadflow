export type ElementType = {
  id: string;
  type: 'text' | 'question' | 'api_call' | 'wait_input';
  content: string;
  displayMode: 'after' | 'simultaneous';
  options?: string[];
  apiConfig?: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  };
};

export type NodeData = {
  id: string;
  label: string;
  elements: ElementType[];
  position?: { x: number; y: number };
};

export enum NodeType {
  START = 'start',
  MESSAGE = 'message',
  QUESTION = 'question',
  CONDITION = 'condition',
  ACTION = 'action',
  API_CALL = 'api_call',
  WAIT = 'wait',
  END = 'end',
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  DATABASE = 'database',
  SWITCH = 'switch',
  LOOP = 'loop',
  DELAY = 'delay',
  NOTIFICATION = 'notification'
}

export const ELEMENT_TYPES = {
  text: {
    label: 'Message texte',
    description: 'Envoyer un message texte à l\'utilisateur'
  },
  question: {
    label: 'Question',
    description: 'Poser une question avec des choix'
  },
  api_call: {
    label: 'Appel API',
    description: 'Appeler un service externe'
  },
  wait_input: {
    label: 'Attente réponse',
    description: 'Attendre une réponse de l\'utilisateur'
  }
};

export const NODE_TYPES = {
  [NodeType.START]: {
    label: 'Début',
    color: '#10B981',
    icon: 'PlayIcon'
  },
  [NodeType.MESSAGE]: {
    label: 'Message',
    color: '#3B82F6',
    icon: 'ChatBubbleLeftRightIcon'
  },
  [NodeType.QUESTION]: {
    label: 'Question',
    color: '#8B5CF6',
    icon: 'QuestionMarkCircleIcon'
  },
  [NodeType.CONDITION]: {
    label: 'Condition',
    color: '#F59E0B',
    icon: 'AdjustmentsHorizontalIcon'
  },
  [NodeType.ACTION]: {
    label: 'Action',
    color: '#EF4444',
    icon: 'BoltIcon'
  },
  [NodeType.API_CALL]: {
    label: 'Appel API',
    color: '#6366F1',
    icon: 'GlobeAltIcon'
  },
  [NodeType.WAIT]: {
    label: 'Attente',
    color: '#9CA3AF',
    icon: 'ClockIcon'
  },
  [NodeType.END]: {
    label: 'Fin',
    color: '#DC2626',
    icon: 'StopIcon'
  },
  [NodeType.EMAIL]: {
    label: 'Email',
    color: '#EC4899',
    icon: 'EnvelopeIcon'
  },
  [NodeType.SMS]: {
    label: 'SMS',
    color: '#14B8A6',
    icon: 'DevicePhoneMobileIcon'
  },
  [NodeType.WEBHOOK]: {
    label: 'Webhook',
    color: '#8B5CF6',
    icon: 'ArrowPathIcon'
  },
  [NodeType.DATABASE]: {
    label: 'Base de données',
    color: '#0EA5E9',
    icon: 'CircleStackIcon'
  },
  [NodeType.SWITCH]: {
    label: 'Switch',
    color: '#F97316',
    icon: 'ArrowsRightLeftIcon'
  },
  [NodeType.LOOP]: {
    label: 'Boucle',
    color: '#84CC16',
    icon: 'ArrowPathRoundedSquareIcon'
  },
  [NodeType.DELAY]: {
    label: 'Délai',
    color: '#64748B',
    icon: 'ClockIcon'
  },
  [NodeType.NOTIFICATION]: {
    label: 'Notification',
    color: '#EA580C',
    icon: 'BellIcon'
  }
};
