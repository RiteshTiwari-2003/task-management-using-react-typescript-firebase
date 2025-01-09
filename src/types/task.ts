export type TaskStatus = 'Todo' | 'In-Progress' | 'Completed';
export type TaskCategory = 'Work' | 'Personal';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface TaskActivity {
  action: string;
  timestamp: Date;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  attachments?: string[];
  activities: TaskActivity[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userId: string;
}

export interface TaskFilter {
  category?: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  searchQuery?: string;
}
