import axios from 'axios';
import { API_URL } from '../config';

export interface Session {
  id: string;
  assistant_id: string;
  user_id?: string;
  user_info?: Record<string, any>;
  status: 'active' | 'completed' | 'abandoned';
  lead_status: 'none' | 'partial' | 'complete';
  current_node_id?: string;
  started_at: string;
  ended_at?: string;
  completion_percentage: number;
}

export interface Message {
  id: string;
  session_id: string;
  sender: 'bot' | 'user';
  content: string;
  content_type: 'text' | 'form' | 'image' | 'video' | 'audio' | 'file' | 'quick_reply';
  node_id?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AnalyticsOverview {
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  abandoned_sessions: number;
  total_leads: number;
  partial_leads: number;
  complete_leads: number;
  average_completion_percentage: number;
  average_session_duration: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  sessions_by_day: Record<string, number>;
  leads_by_day: Record<string, number>;
  completion_by_node: Array<{
    node_id: string;
    node_label: string;
    visits: number;
    completion_rate: number;
  }>;
  popular_responses: Array<{
    node_id: string;
    node_label: string;
    field: string;
    responses: Array<{
      value: string;
      count: number;
    }>;
  }>;
  average_time_by_node: Array<{
    node_id: string;
    node_label: string;
    average_time_seconds: number;
  }>;
}

class SessionService {
  async createSession(assistant_id: string, user_id?: string, user_info?: Record<string, any>): Promise<Session> {
    const response = await axios.post(`${API_URL}/sessions`, {
      assistant_id,
      user_id,
      user_info
    });
    return response.data;
  }

  async addMessage(
    session_id: string,
    content: string,
    sender: 'bot' | 'user',
    content_type: 'text' | 'form' | 'image' | 'video' | 'audio' | 'file' | 'quick_reply' = 'text',
    node_id?: string,
    metadata?: Record<string, any>
  ): Promise<Message> {
    const response = await axios.post(`${API_URL}/sessions/${session_id}/messages`, {
      session_id,
      sender,
      content,
      content_type,
      node_id,
      metadata
    });
    return response.data;
  }

  async endSession(session_id: string): Promise<Session> {
    const response = await axios.put(`${API_URL}/sessions/${session_id}/end`);
    return response.data;
  }

  async getSession(session_id: string): Promise<Session> {
    const response = await axios.get(`${API_URL}/sessions/${session_id}`);
    return response.data;
  }

  async getSessionMessages(session_id: string): Promise<Message[]> {
    const response = await axios.get(`${API_URL}/sessions/${session_id}/messages`);
    return response.data;
  }

  async getAssistantSessions(assistant_id: string): Promise<Session[]> {
    const response = await axios.get(`${API_URL}/assistants/${assistant_id}/sessions`);
    return response.data;
  }

  async getAssistantAnalytics(assistant_id: string, days: number = 30): Promise<AnalyticsData> {
    const response = await axios.get(`${API_URL}/assistants/${assistant_id}/analytics?days=${days}`);
    return response.data;
  }
}

export default new SessionService();
