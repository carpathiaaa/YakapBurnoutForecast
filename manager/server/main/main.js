import express from "express";
import cors from "cors";
const server = express();
import {requireAuth, firestoreDb} from "../firebaseAdmin/firebaseAdmin.js";

const PORT = process.env.PORT || 3000;

// CORS configuration for production
const corsOptions = {
  origin: [
    'https://yakap-manager-web.onrender.com',
    'http://localhost:5173', // For local development
    'http://localhost:3000'  // For local development
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

server.use(express.json());
server.use(cors(corsOptions));

// Health check endpoint
server.get("/", (req, res) => {
    res.send("YAKAP Server is running successfully!");
});

server.get("/protected", requireAuth, (req, res) => {
    res.json({verified: true, message: "Access granted"});
});

server.get("/allData", async (req, res) => {
    try{
        const querySnapshot = await firestoreDb.collection("users").get();
        const userData = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        res.json(userData);
    } catch(error){
        console.error("Firestore error:", error);
        res.status(500).json({error: "Firestore error", message: error.message});
    }
});

// Error handling middleware
server.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: "Something went wrong!", message: err.message});
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


