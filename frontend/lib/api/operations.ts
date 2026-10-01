import { apiClient } from './client';

export interface OperationsSummary {
  team_efficiency: {
    total_hours_logged: number;
    hours_by_project: Record<string, number>;
  };
  ai_optimization: {
    total_cache_hits: number;
    total_fresh_calls: number;
    total_saved_compute: number;
  };
  notification_stats: {
    sent: number;
    pending: number;
    failed: number;
  };
}

export const getOperationsSummary = async (): Promise<OperationsSummary> => {
  return apiClient<OperationsSummary>('/operations/summary');
};
