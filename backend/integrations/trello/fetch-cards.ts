// fetch-cards.ts
import axios from 'axios';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const TRELLO_KEY = process.env.TRELLO_KEY!;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN!;
const BOARD_ID = process.env.BOARD_ID!;
const API_BASE = 'https://api.trello.com/1';

async function fetchCardsFromBoard() {
  try {
    const response = await axios.get(`${API_BASE}/boards/${BOARD_ID}/cards`, {
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
  } catch (error: any) {
    console.error('❌ Error fetching cards:', error.response?.data || error.message);
  }

}

fetchCardsFromBoard();
