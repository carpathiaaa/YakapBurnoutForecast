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
export declare const getTrelloData: () => TrelloApiResponse;
//# sourceMappingURL=trello-api.d.ts.map