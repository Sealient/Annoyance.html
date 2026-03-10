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

const canvas = document.getElementById('gameCanvas');
const ctx = canvas?.getContext('2d');
const counterSpan = document.querySelector('#live-counter span');
const gridContainer = document.getElementById('user-grid');
const readyBtn = document.getElementById('ready-btn');

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

onValue(sessionsRef, (snap) => {
    const players = snap.val() ? Object.values(snap.val()) : [];
    if (counterSpan) counterSpan.innerText = players.length;
    
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
        if (players.every(p => p.ready) && !isRacing) startRace(players);
    }
});

// 2. Rendering
function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 500);
    
    for(let y=0; y<10; y++) {
        for(let x=0; x<8; x++) {
            const cell = boardData[y][x];
            if (cell === 'TAR') { ctx.fillStyle = '#4a3728'; ctx.fillRect(x*50, y*50, 50, 50); }
            if (cell === 'FAN') { ctx.fillStyle = '#bae6fd'; ctx.fillRect(x*50, y*50, 50, 50); }
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(x*50, y*50, 50, 50);
        }
    }

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI*2);
    ctx.fill();
}

// 3. Build Logic
canvas?.addEventListener('click', (e) => {
    if (isRacing) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 50);
    const y = Math.floor((e.clientY - rect.top) / 50);
    
    if (y >= 0 && y < 10 && x >= 0 && x < 8) {
        boardData[y][x] = boardData[y][x] === selectedTool ? null : selectedTool;
        render();
    }
});

// 4. Physics Loop (Fixed boundary checks)
function update() {
    if (!isRacing) return;

    ball.vy += 0.15; // Gravity
    
    const gx = Math.floor(ball.x / 50);
    const gy = Math.floor(ball.y / 50);
    
    // THE FIX: Check if gy and gx are within boardData bounds before reading
    if (gy >= 0 && gy < 10 && gx >= 0 && gx < 8) {
        const effect = boardData[gy][gx];
        if (effect === 'TAR') {
            ball.vx *= 0.6;
            ball.vy *= 0.6;
        } else if (effect === 'FAN') {
            ball.vy -= 0.4;
        }
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Side wall bounce
    if (ball.x < 10 || ball.x > 390) {
        ball.vx *= -0.5;
        ball.x = ball.x < 10 ? 10 : 390;
    }

    if (ball.y > 510) {
        alert("GOAL! You made it through the sabotage.");
        location.reload();
        return;
    }

    render();
    requestAnimationFrame(update);
}

// 5. Swap Mechanics
if (readyBtn) {
    readyBtn.onclick = () => {
        set(myRef, { id: myId, ready: true, board: boardData });
        readyBtn.innerText = "WAITING FOR SABOTEUR...";
        readyBtn.disabled = true;
    };
}

function startRace(players) {
    isRacing = true;
    const opponent = players.find(p => p.id !== myId);
    boardData = opponent.board;
    
    document.getElementById('overlay').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('mode-label').innerText = "RACING!";
        update();
    }, 2000);
}

// Tool Setup
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelector('.tool-btn.active').classList.remove('active');
        btn.classList.add('active');
        selectedTool = btn.dataset.type;
    };
});

render();
