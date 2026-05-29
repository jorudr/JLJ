import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBIyST2glGpq6guZ8-yTlegn_wGRTeKw8s",
    authDomain: "voes-a88f4.firebaseapp.com",
    projectId: "voes-a88f4",
    storageBucket: "voes-a88f4.firebasestorage.app",
    messagingSenderId: "79915571390",
    appId: "1:79915571390:web:fe7659ef2933e1167826ef",
    measurementId: "G-2THWFQZF51"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
    try {
        console.log("Signing in anonymously...");
        await signInAnonymously(auth);
        console.log("Signed in! Writing to Firestore...");
        
        await setDoc(doc(db, "app_settings", "update_notification"), {
            showUpdate: true,
            downloadLink: "https://example.com/download/latest"
        });
        console.log("Successfully wrote to Firestore");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

run();
