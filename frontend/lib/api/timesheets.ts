import { apiClient } from './client';

export interface TimesheetCreate {
  user_id: string;
  project_name: string;
  hours_logged: number;
  task_description?: string;
}

export interface TimesheetResponse {
  id: string;
  user_full_name: string | null;
  project_name: string;
  hours_logged: number;
  task_description?: string;
  logged_at: string;
}

export const logTimesheet = async (data: TimesheetCreate): Promise<TimesheetResponse> => {
  return apiClient<TimesheetResponse>('/timesheets/log', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getTimesheets = async (): Promise<TimesheetResponse[]> => {
  return apiClient<TimesheetResponse[]>('/timesheets');
};
