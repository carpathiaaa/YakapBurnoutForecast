// test-trello-connection.ts
import { getTasksByWeek, getUrgencyLevels } from './backend/integrations/trello/trello-analyzer';

// Test data that matches the actual cards.json structure
const testCards = [
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

console.log('Testing Trello data connection...');
console.log('Tasks by week:', getTasksByWeek(testCards));
console.log('Urgency levels:', getUrgencyLevels(testCards)); 