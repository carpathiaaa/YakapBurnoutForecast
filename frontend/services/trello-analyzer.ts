// trello-analyzer.ts - Frontend version
type Card = {
  name: string;
  due: string | null;
  id: string;
  dateLastActivity: string;
};

type DailyTaskCount = Record<string, number>;

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Tasks for the next 7 days
export function getTasksByWeek(cards: Card[]): DailyTaskCount {
  const result: DailyTaskCount = {};
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    const dayStr = formatDate(day);
    result[dayStr] = 0;
  }

  for (const card of cards) {
    if (!card.due) continue;
    const dueDate = new Date(card.due);
    const dueStr = formatDate(dueDate);
    if (dueStr in result) {
      result[dueStr]++;
    }
  }

  return result;
}

// Urgency levels
export function getUrgencyLevels(cards: Card[]) {
  const now = new Date();
  const result = {
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0,
    noDeadline: 0
  };

  for (const card of cards) {
    if (!card.due) {
      result.noDeadline++;
      continue;
    }

    const due = new Date(card.due);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      result.overdue++;
    } else if (diffDays === 0) {
      result.dueToday++;
    } else if (diffDays <= 7) {
      result.dueThisWeek++;
    }
  }

  return result;
} 