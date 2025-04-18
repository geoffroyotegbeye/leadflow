export type NodeData = {
  label: string;
  type: NodeType;
  content?: string;
  options?: string[];
  conditions?: Condition[];
  actions?: Action[];
  metadata?: Record<string, any>;
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

export type Condition = {
  id: string;
  type: 'equals' | 'contains' | 'regex' | 'greater' | 'less';
  value: string;
  target: string;
};

export type Action = {
  id: string;
  type: 'save_variable' | 'send_email' | 'webhook' | 'custom';
  config: Record<string, any>;
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
