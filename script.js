import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, push, onDisconnect, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCn7viRlWZWG9tPYZ8pHc74029KIDWCsqY",
    authDomain: "annoyance-32e70.firebaseapp.com",
    databaseURL: "https://annoyance-32e70-default-rtdb.firebaseio.com/",
    projectId: "annoyance-32e70"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Safe Element Selectors
const gridContainer = document.getElementById('user-grid');
const counterSpan = document.querySelector('#live-counter span');
const canvas = document.getElementById('gameCanvas');
const readyBtn = document.getElementById('ready-btn');

const ctx = canvas ? canvas.getContext('2d') : null;
let boardData = Array(10).fill().map(() => Array(8).fill(null));
let isRacing = false;
let selectedTool = 'TAR';
let ball = { x: 200, y: 30, vx: 0, vy: 0 };
let myId = Math.random().toString(36).substring(7);

// 1. Presence
const sessionsRef = ref(db, 'marble_sessions');
const myRef = push(sessionsRef);
onDisconnect(myRef).remove();
set(myRef, { id: myId, ready: false, board: boardData });

// 2. Lobby Logic
onValue(sessionsRef, (snap) => {
    const players = snap.val() ? Object.values(snap.val()) : [];
    if (counterSpan) counterSpan.innerText = players.length;
    
    // Draw dots
    if (gridContainer) {
        gridContainer.innerHTML = '';
        players.forEach(() => {
            const dot = document.createElement('div');
            dot.className = 'user-dot active';
            gridContainer.appendChild(dot);
        });
    }

    if (players.length >= 2) {
        document.getElementById('lobby-layer').classList.add('hidden');
        document.getElementById('game-layer').classList.remove('hidden');
        
        const allReady = players.every(p => p.ready);
        if (allReady && !isRacing) startRace(players);
    }
});

// 3. Build Logic
if (canvas) {
    canvas.addEventListener('click', (e) => {
        if (isRacing) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 50);
        const y = Math.floor((e.clientY - rect.top) / 50);
        boardData[y][x] = boardData[y][x] === selectedTool ? null : selectedTool;
        render();
    });
}

function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 500);
    for(let y=0; y<10; y++) {
        for(let x=0; x<8; x++) {
            if (boardData[y][x] === 'TAR') { ctx.fillStyle = '#4a3728'; ctx.fillRect(x*50, y*50, 50, 50); }
            if (boardData[y][x] === 'FAN') { ctx.fillStyle = '#bae6fd'; ctx.fillRect(x*50, y*50, 50, 50); }
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(x*50, y*50, 50, 50);
        }
    }
    // Ball
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI*2);
    ctx.fill();
}

// 4. Swap Logic
if (readyBtn) {
    readyBtn.onclick = () => {
        set(myRef, { id: myId, ready: true, board: boardData });
        readyBtn.innerText = "WAITING...";
        readyBtn.disabled = true;
    };
}

function startRace(players) {
    isRacing = true;
    const opponent = players.find(p => p.id !== myId);
    boardData = opponent.board; // Grab their sabotage
    
    document.getElementById('overlay').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('overlay').classList.add('hidden');
        requestAnimationFrame(update);
    }, 2000);
}

function update() {
    if (!isRacing) return;
    ball.vy += 0.1; 
    const gx = Math.floor(ball.x / 50);
    const gy = Math.floor(ball.y / 50);
    
    if (boardData[gy] && boardData[gy][gx]) {
        if (boardData[gy][gx] === 'TAR') { ball.vx *= 0.5; ball.vy *= 0.5; }
        if (boardData[gy][gx] === 'FAN') { ball.vy -= 0.3; }
    }

    ball.x += ball.vx;
    ball.y += ball.vy;
    
    if (ball.y > 500) {
        alert("Board Cleared!");
        location.reload();
        return;
    }
    render();
    requestAnimationFrame(update);
}

// Tool Switching
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelector('.tool-btn.active').classList.remove('active');
        btn.classList.add('active');
        selectedTool = btn.dataset.type;
    };
});

render();
