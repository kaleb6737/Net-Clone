import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCCna3wDxGWjha8Nuu6-iQSBZRlHGLu2z0",
    authDomain: "netflex-clone-project-67266.firebaseapp.com",
    projectId: "netflex-clone-project-67266",
    storageBucket: "netflex-clone-project-67266.appspot.com",
    messagingSenderId: "991833272190",
    appId: "1:991833272190:web:f2258f466e0d2387630d2f",
    measurementId: "G-ZBFG059WV8"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export { auth };
export default db;
