// مفاتيح الاتصال بخادم Firebase السحابي
const firebaseConfig = {
    apiKey: "AIzaSyDP9S6gXZYyHHRnj_VUdidCFUoDp5put1o",
    authDomain: "zintan-health.firebaseapp.com",
    projectId: "zintan-health",
    storageBucket: "zintan-health.firebasestorage.app",
    messagingSenderId: "942207422184",
    appId: "1:942207422184:web:cb4abc8799b9a9d355035d"
};

// تهيئة الاتصال بالسحابة
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();