// analyze-cards.ts
import { getTasksByDay, getTasksByWeek, getUrgencyLevels } from './backend/integrations/trello/trello-analyzer';
import * as fs from 'fs';

const raw = fs.readFileSync('./backend/integrations/trello/cards.json', 'utf-8');
const cards = JSON.parse(raw);

console.log('Tasks per Day:');
console.table(getTasksByDay(cards));

console.log('\nTasks in the Next 7 Days:');
console.table(getTasksByWeek(cards));

console.log('\nTask Urgency Levels:');
console.table(getUrgencyLevels(cards));
