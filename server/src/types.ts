export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  position: number;
  createdAt: number;
  updatedAt: number;
}

export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
}

export interface MoveInput {
  status: TaskStatus;
  beforeId?: string;
}

export const STATUSES: TaskStatus[] = ['todo', 'doing', 'done'];
export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
