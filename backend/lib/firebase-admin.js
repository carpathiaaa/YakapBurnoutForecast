"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
// Initialize Firebase Admin SDK
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : undefined;
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)({
        credential: serviceAccount ? (0, app_1.cert)(serviceAccount) : undefined,
        // If no service account is provided, Firebase Admin will use default credentials
        // This works in production with Firebase Functions
    });
}
const db = (0, firestore_1.getFirestore)();
exports.db = db;
const auth = (0, auth_1.getAuth)();
exports.auth = auth;
//# sourceMappingURL=firebase-admin.js.map