export interface ChatMessage {
  id: string;
  content: string;
  type: string;
  sender: 'bot' | 'user';
  options?: string[];
  elementData?: any;
  timestamp: number;
  isTyping?: boolean;
  visible?: boolean;
}