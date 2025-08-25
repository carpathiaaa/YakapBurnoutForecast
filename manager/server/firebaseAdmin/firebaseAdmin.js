import {initializeApp, applicationDefault, cert} from "firebase-admin/app";
import {getAuth as getAdminAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import serviceAccount from "./serviceAccount/carb-on-firebase-adminsdk-fbsvc-65ace574ac.json" with {type: 'json'};

initializeApp({
    credential: cert(serviceAccount),
    projectId: "<carb-on>"
});

const requireAuth = async (req, res, next) => {
    try{
        const authHeader = req.headers.authorization || "";
        const match = authHeader.match(/Bearer (.+)/);
        if (!match) return res.status(401).json({error: "No token provided"});
        const idToken = match[1];
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        req.user = decoded;
        next();
    } catch(error){
        return res.status(401).json({error: "Invalid or expired token"});
    }
};

const firestoreDb = getFirestore();


export {requireAuth, firestoreDb};