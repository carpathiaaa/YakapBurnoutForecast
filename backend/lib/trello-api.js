"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrelloData = void 0;
// trello-api.ts
const trello_analyzer_1 = require("./integrations/trello/trello-analyzer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const getTrelloData = () => {
    try {
        // Read the cards.json file
        const cardsPath = path.join(__dirname, 'integrations/trello/cards.json');
        const raw = fs.readFileSync(cardsPath, 'utf-8');
        const cards = JSON.parse(raw);
        // Process the data using the existing analyzer functions
        const tasksByWeek = (0, trello_analyzer_1.getTasksByWeek)(cards);
        const urgencyLevels = (0, trello_analyzer_1.getUrgencyLevels)(cards);
        const totalTasks = cards.length;
        const averageTasksPerDay = Object.values(tasksByWeek).reduce((sum, count) => sum + count, 0) / 7;
        return {
            tasksByWeek,
            urgencyLevels,
            totalTasks,
            averageTasksPerDay
        };
    }
    catch (error) {
        console.error('Error processing Trello data:', error);
        throw error;
    }
};
exports.getTrelloData = getTrelloData;
//# sourceMappingURL=trello-api.js.map