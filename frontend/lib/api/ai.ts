import { apiClient } from './client';

export interface AITaskRequest {
  prompt: string;
}

export interface AITaskResponse {
  response: any;
  cached: boolean;
  saved_compute_cost: number;
  call_count: number;
}

export const optimizeTask = async (data: AITaskRequest): Promise<AITaskResponse> => {
  return apiClient<AITaskResponse>('/ai/optimize-task', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
