import { apiClient } from '../../../core/network/api_client';

export interface SystemHealth {
  status: string;
  uptime: number;
  osUptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercentage: string;
  };
  cpu: {
    loadAverage: number[];
    cores: number;
  };
  nodeVersion: string;
  platform: string;
  timestamp: string;
}

export interface LogEntry {
  message?: string;
  timestamp?: string;
  level?: string;
  context?: string;
  trace?: string;
  [key: string]: unknown;
}

export interface QueueStats {
  queue: string;
  stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
}

export interface DbStats {
  status: string;
  sizeMb: string;
  type: string;
}

export const adminService = {
  getSystemHealth: async (): Promise<SystemHealth> => {
    return apiClient.get<SystemHealth>('/admin/health');
  },

  getLogs: async (type: 'error' | 'system' | 'combined', lines: number = 100): Promise<{ logs: LogEntry[], message?: string }> => {
    return apiClient.get<{ logs: LogEntry[], message?: string }>(`/admin/logs?type=${type}&lines=${lines}`);
  },

  clearCache: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/admin/cache/clear');
  },

  getQueueStats: async (): Promise<QueueStats> => {
    return apiClient.get<QueueStats>('/admin/queues');
  },

  getDbStats: async (): Promise<DbStats> => {
    return apiClient.get<DbStats>('/admin/db/stats');
  },

  triggerBackup: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/admin/db/backup');
  },

  listBackups: async (): Promise<{ backups: string[] }> => {
    return apiClient.get<{ backups: string[] }>('/admin/backups');
  },

  restoreBackup: async (fileName: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/admin/backups/restore', { fileName });
  }
};
