type Card = {
    name: string;
    due: string | null;
    id: string;
    dateLastActivity: string;
};
type DailyTaskCount = Record<string, number>;
export declare function getTasksByDay(cards: Card[]): DailyTaskCount;
export declare function getTasksByWeek(cards: Card[]): DailyTaskCount;
export declare function getUrgencyLevels(cards: Card[]): {
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    noDeadline: number;
};
export {};
//# sourceMappingURL=trello-analyzer.d.ts.map