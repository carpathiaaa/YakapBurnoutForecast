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
exports.getTasksByDay = getTasksByDay;
exports.getTasksByWeek = getTasksByWeek;
exports.getUrgencyLevels = getUrgencyLevels;
// trello-analyzer.ts
const fs = __importStar(require("fs"));
function readCards() {
    const raw = fs.readFileSync('cards.json', 'utf-8');
    return JSON.parse(raw);
}
function formatDate(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
// (1) Tasks per day
function getTasksByDay(cards) {
    const result = {};
    for (const card of cards) {
        if (!card.due)
            continue;
        const date = formatDate(new Date(card.due));
        result[date] = (result[date] || 0) + 1;
    }
    return result;
}
// (2) Tasks for the next 7 days
function getTasksByWeek(cards) {
    const result = {};
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() + i);
        const dayStr = formatDate(day);
        result[dayStr] = 0;
    }
    for (const card of cards) {
        if (!card.due)
            continue;
        const dueDate = new Date(card.due);
        const dueStr = formatDate(dueDate);
        if (dueStr in result) {
            result[dueStr]++;
        }
    }
    return result;
}
// (3) Urgency levels
function getUrgencyLevels(cards) {
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
        }
        else if (diffDays === 0) {
            result.dueToday++;
        }
        else if (diffDays <= 7) {
            result.dueThisWeek++;
        }
    }
    return result;
}
//# sourceMappingURL=trello-analyzer.js.map