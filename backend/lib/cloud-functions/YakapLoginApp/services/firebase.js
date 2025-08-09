"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.auth = void 0;
// firebaseConfig.ts
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth"); // Use Web Auth
const firestore_1 = require("firebase/firestore");
const firebaseConfig = {
    apiKey: "AIzaSyCAG7uRyW-Ng6chx938sxSbKIN55trYIlA",
    authDomain: "carb-on.firebaseapp.com",
    projectId: "carb-on",
    storageBucket: "carb-on.firebasestorage.app",
    messagingSenderId: "52247729811",
    appId: "1:52247729811:web:17d14d4fd20b845bca9f66",
    measurementId: "G-7V446XVETG"
};
const app = (0, app_1.initializeApp)(firebaseConfig);
const auth = (0, auth_1.getAuth)(app); // Use default memory persistence for now
exports.auth = auth;
const db = (0, firestore_1.getFirestore)(app);
exports.db = db;
//# sourceMappingURL=firebase.js.map