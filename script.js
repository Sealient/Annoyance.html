import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, push, onDisconnect, set, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --- CONFIG (Use your annoyance-32e70 URL) ---
const firebaseConfig = {
    apiKey: "AIzaSyCn7viRlWZWG9tPYZ8pHc74029KIDWCsqY",
    authDomain: "annoyance-32e70.firebaseapp.com",
    databaseURL: "https://annoyance-32e70-default-rtdb.firebaseio.com/",
    projectId: "annoyance-32e70",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Game State
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let grid = Array(10).fill().map(() => Array(8).fill(null)); // 50px cells
let selectedTool = 'TAR';
let isRacing = false;
let ball = { x: 200, y: 30, vx: 0, vy: 0 };
let myBoardId = Math.random().toString(36).substring(7);

// 1. Presence & Matchmaking
const connectionsRef = ref(db, 'marble_sessions');
const myRef = push(connectionsRef);
onDisconnect(myRef).remove();
set(myRef, { id: myBoardId, ready: false, board: [] });

onValue(connectionsRef, (snap) => {
    const players = snap.val() ? Object.values(snap.val()) : [];
    document.querySelector('#live-counter span').innerText = players.length;
    
    if (players.length >= 2) {
        document.getElementById('lobby-layer').classList.add('hidden');
        document.getElementById('game-layer').classList.remove('hidden');
        
        // Check if everyone is ready to swap
        const allReady = players.every(p => p.ready);
        if (allReady && !isRacing) startTheRace(players);
    }
});

// 2. Build Mode Logic
canvas.addEventListener('click', (e) => {
    if (isRacing) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 50);
    const y = Math.floor((e.clientY - rect.top) / 50);
    grid[y][x] = grid[y][x] === selectedTool ? null : selectedTool;
    drawBoard();
});

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw Grid
    for(let y=0; y<10; y++) {
        for(let x=0; x<8; x++) {
            if (grid[y][x] === 'TAR') { ctx.fillStyle = '#4a3728'; ctx.fillRect(x*50, y*50, 50, 50); }
            if (grid[y][x] === 'FAN') { ctx.fillStyle = '#bae6fd'; ctx.fillRect(x*50, y*50, 50, 50); }
            ctx.strokeStyle = '#eee';
            ctx.strokeRect(x*50, y*50, 50, 50);
        }
    }
    // Draw Ball
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI*2);
    ctx.fill();
}

// 3. The Swap & Physics
document.getElementById('ready-btn').onclick = () => {
    set(myRef, { id: myBoardId, ready: true, board: grid });
    document.getElementById('ready-btn').innerText = "WAITING FOR OPPONENT...";
    document.getElementById('ready-btn').disabled = true;
};

function startTheRace(players) {
    isRacing = true;
    document.getElementById('overlay').classList.remove('hidden');
    
    // Get opponent's board (the one that isn't mine)
    const opponent = players.find(p => p.id !== myBoardId);
    grid = opponent.board;
    
    setTimeout(() => {
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('mode-label').innerText = "RACING ON OPPONENT'S BOARD!";
        requestAnimationFrame(updatePhysics);
    }, 2000);
}

function updatePhysics() {
    if (!isRacing) return;

    ball.vy += 0.15; // Gravity
    
    // Grid interaction
    const gx = Math.floor(ball.x / 50);
    const gy = Math.floor(ball.y / 50);
    
    if (grid[gy] && grid[gy][gx]) {
        const type = grid[gy][gx];
        if (type === 'TAR') { ball.vx *= 0.8; ball.vy *= 0.8; }
        if (type === 'FAN') { ball.vy -= 0.4; } // Push up
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Boundary checks
    if (ball.x < 10 || ball.x > 390) ball.vx *= -0.5;
    if (ball.y > 490) {
        alert("FINISH! You survived the sabotage.");
        location.reload();
        return;
    }

    drawBoard();
    requestAnimationFrame(updatePhysics);
}

// Tool selection
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelector('.tool-btn.active').classList.remove('active');
        btn.classList.add('active');
        selectedTool = btn.dataset.type;
    };
});

drawBoard();
