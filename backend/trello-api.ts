// trello-api.ts
import { getTasksByDay, getTasksByWeek, getUrgencyLevels } from './integrations/trello/trello-analyzer';
import * as fs from 'fs';
import * as path from 'path';

export interface TrelloApiResponse {
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

export const getTrelloData = (): TrelloApiResponse => {
  try {
    // Read the cards.json file
    const cardsPath = path.join(__dirname, 'integrations/trello/cards.json');
    const raw = fs.readFileSync(cardsPath, 'utf-8');
    const cards = JSON.parse(raw);

    // Process the data using the existing analyzer functions
    const tasksByWeek = getTasksByWeek(cards);
    const urgencyLevels = getUrgencyLevels(cards);
    
    const totalTasks = cards.length;
    const averageTasksPerDay = Object.values(tasksByWeek).reduce((sum, count) => sum + count, 0) / 7;

    return {
      tasksByWeek,
      urgencyLevels,
      totalTasks,
      averageTasksPerDay
    };
  } catch (error) {
    console.error('Error processing Trello data:', error);
    throw error;
  }
}; 