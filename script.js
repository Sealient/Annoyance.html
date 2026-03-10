import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, push, onDisconnect, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Using your exact database URL provided
const firebaseConfig = {
    apiKey: "AIzaSyCn7viRlWZWG9tPYZ8pHc74029KIDWCsqY",
    authDomain: "annoya-33242.firebaseapp.com",
    databaseURL: "https://annoyance-32e70-default-rtdb.firebaseio.com/",
    projectId: "annoya-33242",
    storageBucket: "annoya-33242.firebasestorage.app",
    messagingSenderId: "427120642080",
    appId: "1:427120642080:web:4793dccec5cc1523ca5445",
    measurementId: "G-NGDS5F7GRD"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const lobby = document.getElementById('lobby-screen');
const voting = document.getElementById('voting-screen');
const grid = document.getElementById('user-grid');
const statusText = document.getElementById('status-text');
const pollOverlay = document.getElementById('polling-overlay');
const feedback = document.getElementById('feedback-node');
const slider = document.getElementById('volume-proposal');
const propDisplay = document.getElementById('prop-val');
const currentVolDisplay = document.getElementById('current-vol');
const counter = document.querySelector('#live-counter span');

let currentAnswer = 0;
let userCount = 0;

// --- REAL-TIME PRESENCE ---
const connectionsRef = ref(db, 'connections');
const connectedRef = ref(db, '.info/connected');

onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        const myConRef = push(connectionsRef);
        onDisconnect(myConRef).remove();
        set(myConRef, serverTimestamp());
    }
});

onValue(connectionsRef, (snap) => {
    const data = snap.val();
    userCount = data ? Object.keys(data).length : 0;
    updateLobbyUI(userCount);
});

function updateLobbyUI(count) {
    if (counter) counter.innerText = count;
    grid.innerHTML = '';
    
    // Require 3 users to unlock
    const displayCount = Math.max(count, 5);
    for (let i = 0; i < displayCount; i++) {
        const dot = document.createElement('div');
        dot.className = `user-dot ${i < count ? 'active' : ''}`;
        grid.appendChild(dot);
    }

    if (count >= 3) {
        statusText.innerText = "Quorum reached. Entering Session...";
        setTimeout(() => {
            lobby.classList.add('hidden');
            voting.classList.remove('hidden');
            checkBanStatus();
        }, 1500);
    } else {
        lobby.classList.remove('hidden');
        voting.classList.add('hidden');
        statusText.innerText = `Waiting for ${3 - count} more real citizen(s)...`;
    }
}

// --- VOTING LOGIC ---
slider.oninput = () => {
    propDisplay.innerText = slider.value;
};

document.getElementById('submit-vote').onclick = () => {
    const userRequest = parseInt(slider.value);
    pollOverlay.classList.remove('hidden');
    feedback.innerText = "";

    setTimeout(() => {
        pollOverlay.classList.add('hidden');
        
        // Logical Spite: Force a consensus opposite of user request
        let consensus = userRequest > 50 ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 10) + 90;

        currentVolDisplay.innerText = consensus;
        slider.value = consensus;
        propDisplay.innerText = consensus;

        localStorage.setItem('volume_banned', 'true');
        feedback.style.color = "#dc2626";
        feedback.innerText = `PROPOSAL REJECTED. The other ${userCount - 1} users found your request "disruptive."`;

        document.getElementById('submit-vote').classList.add('hidden');
        document.getElementById('tax-authority').classList.remove('hidden');
        generateMath();
    }, 3000);
};

// --- MATH TAX ---
function checkBanStatus() {
    if (localStorage.getItem('volume_banned') === 'true') {
        document.getElementById('submit-vote').classList.add('hidden');
        document.getElementById('tax-authority').classList.remove('hidden');
        feedback.innerText = "Suspension still active from previous misconduct.";
        generateMath();
    }
}

function generateMath() {
    const a = Math.floor(Math.random() * 90) + 11;
    const b = Math.floor(Math.random() * 90) + 11;
    currentAnswer = a + b;
    document.getElementById('math-q').innerText = `${a} + ${b}`;
}

document.getElementById('pay-tax').onclick = () => {
    const userAns = parseInt(document.getElementById('math-ans').value);
    if (userAns === currentAnswer) {
        localStorage.removeItem('volume_banned');
        document.getElementById('tax-authority').classList.add('hidden');
        document.getElementById('submit-vote').classList.remove('hidden');
        document.getElementById('math-ans').value = "";
        feedback.style.color = "#10b981";
        feedback.innerText = "Tax paid. Voting rights partially restored.";
    } else {
        feedback.innerText = "Incorrect. The community questions your competence.";
        generateMath();
    }
};
