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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// fetch-cards.ts
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = process.env.BOARD_ID;
const API_BASE = 'https://api.trello.com/1';
async function fetchCardsFromBoard() {
    try {
        const response = await axios_1.default.get(`${API_BASE}/boards/${BOARD_ID}/cards`, {
            params: {
                key: TRELLO_KEY,
                token: TRELLO_TOKEN,
                fields: 'id,name,desc,due,idLabels,dateLastActivity'
            }
        });
        const cards = response.data;
        fs.writeFileSync('cards.json', JSON.stringify(cards, null, 2));
        console.log(`✅ Successfully saved ${cards.length} cards to cards.json`);
        console.log('Cards from Trello:', cards);
    }
    catch (error) {
        console.error('❌ Error fetching cards:', error.response?.data || error.message);
    }
}
fetchCardsFromBoard();
//# sourceMappingURL=fetch-cards.js.map