import { useState, useCallback } from 'react';
import { webAgentService } from '../services/agentService';
import { AgentMessage, AgentResponse } from '@ichat-ocean/shared';

interface UseAgentState {
  isLoading: boolean;
  error: string | null;
  response: AgentResponse | null;
}

interface UseAgentActions {
  sendMessage: (message: string, context?: AgentMessage[]) => Promise<AgentResponse | null>;
  sendSimpleMessage: (message: string) => Promise<AgentResponse | null>;
  sendSystemMessage: (systemPrompt: string, userMessage: string) => Promise<AgentResponse | null>;
  clearError: () => void;
}

export function useAgent(): UseAgentState & UseAgentActions {
  const [state, setState] = useState<UseAgentState>({
    isLoading: false,
    error: null,
    response: null,
  });

  const sendMessage = useCallback(async (message: string, context?: AgentMessage[]): Promise<AgentResponse | null> => {
    setState((prev: UseAgentState) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await webAgentService.sendMessage(message, context);
      setState((prev: UseAgentState) => ({
        ...prev,
        isLoading: false,
        response,
      }));
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred while sending the message';
      setState((prev: UseAgentState) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const sendSimpleMessage = useCallback(async (message: string): Promise<AgentResponse | null> => {
    setState((prev: UseAgentState) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await webAgentService.sendSimpleMessage(message);
      setState((prev: UseAgentState) => ({
        ...prev,
        isLoading: false,
        response,
      }));
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred while sending the message';
      setState((prev: UseAgentState) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const sendSystemMessage = useCallback(async (systemPrompt: string, userMessage: string): Promise<AgentResponse | null> => {
    setState((prev: UseAgentState) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await webAgentService.sendSystemMessage(systemPrompt, userMessage);
      setState((prev: UseAgentState) => ({
        ...prev,
        isLoading: false,
        response,
      }));
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred while sending the message';
      setState((prev: UseAgentState) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev: UseAgentState) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sendMessage,
    sendSimpleMessage,
    sendSystemMessage,
    clearError,
  };
}