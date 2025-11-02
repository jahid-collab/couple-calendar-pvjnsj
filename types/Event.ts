
export interface Event {
  id: string;
  title: string;
  date: string;
  type: 'vacation' | 'date' | 'trip' | 'event';
  description?: string;
  color: string;
  emoji?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  targetDate?: string;
  color: string;
  emoji?: string;
}

export interface Reminder {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  shared: boolean;
}
