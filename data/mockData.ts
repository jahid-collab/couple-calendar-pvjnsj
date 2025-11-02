
import { Event, Goal, Reminder } from '@/types/Event';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Anniversary Dinner',
    date: '2024-12-15',
    type: 'date',
    description: 'Romantic dinner at our favorite restaurant',
    color: '#E91E63',
    emoji: '💕',
  },
  {
    id: '2',
    title: 'Weekend Getaway',
    date: '2024-12-20',
    type: 'trip',
    description: 'Mountain cabin retreat',
    color: '#9C27B0',
    emoji: '🏔️',
  },
  {
    id: '3',
    title: 'Beach Vacation',
    date: '2025-01-10',
    type: 'vacation',
    description: 'Two weeks in Hawaii',
    color: '#FFD180',
    emoji: '🏖️',
  },
];

export const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Plan a Dream Vacation',
    description: 'Save and plan for our dream trip to Europe',
    progress: 35,
    targetDate: '2025-06-01',
    color: '#E91E63',
    emoji: '✈️',
  },
  {
    id: '2',
    title: 'Save for Down Payment',
    description: 'Save $50,000 for our first home',
    progress: 60,
    targetDate: '2025-12-31',
    color: '#9C27B0',
    emoji: '🏠',
  },
  {
    id: '3',
    title: 'Learn to Cook Together',
    description: 'Master 20 new recipes as a couple',
    progress: 15,
    color: '#F48FB1',
    emoji: '👨‍🍳',
  },
  {
    id: '4',
    title: 'Fitness Journey',
    description: 'Complete a 5K run together',
    progress: 45,
    targetDate: '2025-03-15',
    color: '#FFD180',
    emoji: '🏃',
  },
];

export const mockReminders: Reminder[] = [
  {
    id: '1',
    title: 'Book restaurant for anniversary',
    completed: false,
    dueDate: '2024-12-10',
    shared: true,
  },
  {
    id: '2',
    title: 'Buy concert tickets',
    completed: false,
    dueDate: '2024-12-08',
    shared: true,
  },
  {
    id: '3',
    title: 'Plan weekend activities',
    completed: true,
    shared: true,
  },
  {
    id: '4',
    title: 'Grocery shopping for dinner',
    completed: false,
    dueDate: '2024-12-07',
    shared: true,
  },
];
