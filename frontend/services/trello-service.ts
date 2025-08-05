// trello-service.ts
import { getTasksByWeek, getUrgencyLevels } from './trello-analyzer';

export interface TrelloData {
  tasksByWeek: Record<string, number>;
  urgencyLevels: {
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    noDeadline: number;
  };
  totalTasks: number;
  averageTasksPerDay: number;
}

// Actual data from cards.json
const actualCards = [
  {
    "id": "688216a9994cf9c7f3312895",
    "name": "Meeting @9Pm",
    "desc": "",
    "due": "2025-07-25T11:19:00.000Z",
    "idLabels": [],
    "dateLastActivity": "2025-07-24T11:19:32.506Z"
  },
  {
    "id": "68847855bdb614c8a81f194b",
    "name": "Updates",
    "desc": "",
    "due": "2025-07-27T06:40:00.000Z",
    "idLabels": [],
    "dateLastActivity": "2025-07-26T06:40:31.937Z"
  },
  {
    "id": "688216cd16587f5dc6def1e3",
    "name": "Procrastinating",
    "desc": "",
    "due": "2025-07-31T11:19:00.000Z",
    "idLabels": [],
    "dateLastActivity": "2025-07-24T11:20:00.540Z"
  },
  {
    "id": "688216ee889efac3e9e3b8ee",
    "name": "Research Part 1",
    "desc": "",
    "due": "2025-07-25T11:19:00.000Z",
    "idLabels": [],
    "dateLastActivity": "2025-07-24T11:20:33.853Z"
  }
];

export const fetchTrelloData = async (): Promise<TrelloData> => {
  try {
    // Use the actual cards data
    const tasksByWeek = getTasksByWeek(actualCards);
    const urgencyLevels = getUrgencyLevels(actualCards);
    
    const totalTasks = actualCards.length;
    const averageTasksPerDay = Object.values(tasksByWeek).reduce((sum, count) => sum + count, 0) / 7;

    console.log('Trello data processed:', {
      tasksByWeek,
      urgencyLevels,
      totalTasks,
      averageTasksPerDay
    });

    return {
      tasksByWeek,
      urgencyLevels,
      totalTasks,
      averageTasksPerDay
    };
  } catch (error) {
    console.error('Error fetching Trello data:', error);
    
    // Return empty data if everything fails
    return {
      tasksByWeek: {},
      urgencyLevels: {
        overdue: 0,
        dueToday: 0,
        dueThisWeek: 0,
        noDeadline: 0
      },
      totalTasks: 0,
      averageTasksPerDay: 0
    };
  }
};

export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const getUrgencyColor = (type: 'overdue' | 'dueToday' | 'dueThisWeek'): string => {
  switch (type) {
    case 'overdue':
      return '#EF4444'; // red
    case 'dueToday':
      return '#F59E0B'; // amber
    case 'dueThisWeek':
      return '#10B981'; // green
    default:
      return '#6B7280'; // gray
  }
}; 