const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const livesEl = document.getElementById('lives');
const powerupStatusEl = document.getElementById('powerupStatus');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySub = document.getElementById('overlaySub');
const startBtn = document.getElementById('startBtn');
const themeSelect = document.getElementById('themeSelect');
const modeSelect = document.getElementById('modeSelect');
const touchControls = document.getElementById('touchControls');
const modeInfo = document.getElementById('modeInfo');

let score = 0;
let highScore = localStorage.getItem('arcade_highscore') || 0;
let lives = 3;
let gameOver = true;
let animationId;
let lastTime = 0;

highScoreEl.textContent = highScore;

/* SISTEMA DE ÁUDIO */
const AudioSys = {
    ctx: null,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    play(freq, type, duration, vol = 0.08) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    },
    shoot() { this.play(750, 'square', 0.08); },
    explosion() { this.play(100, 'sawtooth', 0.22, 0.15); },
    powerup() { this.play(1100, 'sine', 0.18); },
    hit() { this.play(200, 'triangle', 0.12); }
};

/* ESTADO DO JOGADOR E INPUTS */
const player = {
    x: 80,
    y: canvas.height / 2,
    size: 18,
    speed: 380,
    shield: false,
    tripleShotTimer: 0,
    lastShot: 0,
    fireRate: 0.14
};

let keys = {};
let bullets = [];
let enemies = [];
let powerups = [];
let particles = [];
let stars = [];

for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 70 + 20
    });
}

/* SELEÇÃO DE MODO (PC x CELULAR) */
function setGameMode(mode) {
    if (mode === 'mobile') {
        touchControls.classList.add('active');
        modeInfo.textContent = '💡 Modo Celular: Mova pelos botões ou tocando/arrastando na tela!';
        overlaySub.textContent = 'Modo Celular ativo! Toque em Iniciar.';
    } else {
        touchControls.classList.remove('active');
        modeInfo.textContent = '💡 Modo PC: Mova com W/S/A/D ou Setas | Atire com Espaço';
        overlaySub.textContent = 'Modo Computador ativo! Use o teclado.';
    }
}

modeSelect.addEventListener('change', (e) => setGameMode(e.target.value));

// Auto-detectar dispositivo no carregamento inicial
if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768) {
    modeSelect.value = 'mobile';
} else {
    modeSelect.value = 'pc';
}
setGameMode(modeSelect.value);

themeSelect.addEventListener('change', (e) => {
    document.body.setAttribute('data-theme', e.target.value);
});

/* CONTROLES DE TECLADO (PC) */
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

/* CONTROLES TOUCH MULTI-PLATAFORMA (POINTER EVENTS) */
function setupTouchButton(id, keyName) {
    const btn = document.getElementById(id);
    if (!btn) return;

    const startPress = (e) => {
        e.preventDefault();
        AudioSys.init();
        keys[keyName] = true;
        btn.classList.add('active');
    };

    const stopPress = (e) => {
        e.preventDefault();
        keys[keyName] = false;
        btn.classList.remove('active');
    };

    btn.addEventListener('pointerdown', startPress);
    btn.addEventListener('pointerup', stopPress);
    btn.addEventListener('pointercancel', stopPress);
    btn.addEventListener('pointerleave', stopPress);
}

setupTouchButton('btnUp', 'ArrowUp');
setupTouchButton('btnDown', 'ArrowDown');
setupTouchButton('btnLeft', 'ArrowLeft');
setupTouchButton('btnRight', 'ArrowRight');
setupTouchButton('btnFire', ' ');

/* TOQUE E ARRASTE NO CANVAS (CELULAR) */
let canvasDragging = false;

function handleCanvasTouch(e) {
    if (modeSelect.value !== 'mobile' || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    player.x = (e.clientX - rect.left) * scaleX;
    player.y = (e.clientY - rect.top) * scaleY;
}

canvas.addEventListener('pointerdown', (e) => {
    if (modeSelect.value !== 'mobile') return;
    canvasDragging = true;
    keys[' '] = true; // Dispara tiro automático enquanto arrasta no canvas
    handleCanvasTouch(e);
});

canvas.addEventListener('pointermove', (e) => {
    if (canvasDragging) handleCanvasTouch(e);
});

const endCanvasDrag = () => {
    if (canvasDragging) {
        canvasDragging = false;
        keys[' '] = false;
    }
};

canvas.addEventListener('pointerup', endCanvasDrag);
canvas.addEventListener('pointercancel', endCanvasDrag);

/* LÓGICA DE JOGO */
function spawnEnemy() {
    const isHoming = Math.random() < 0.25;
    enemies.push({
        x: canvas.width + 30,
        y: Math.random() * (canvas.height - 40) + 20,
        width: 24,
        height: 24,
        vx: -(Math.random() * 120 + 150),
        vy: isHoming ? 0 : (Math.random() - 0.5) * 50,
        isHoming: isHoming,
        hp: isHoming ? 2 : 1
    });
}

function spawnPowerup() {
    const types = ['shield', 'life', 'triple'];
    powerups.push({
        x: canvas.width + 20,
        y: Math.random() * (canvas.height - 40) + 20,
        radius: 12,
        type: types[Math.floor(Math.random() * types.length)],
        vx: -100
    });
}

function createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 140 + 40;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.35,
            maxLife: 0.35,
            color: color || '#ff0055'
        });
    }
}

function shoot() {
    const now = performance.now() / 1000;
    if (now - player.lastShot < player.fireRate) return;
    player.lastShot = now;

    AudioSys.shoot();

    if (player.tripleShotTimer > 0) {
        bullets.push({ x: player.x + player.size, y: player.y, vx: 500, vy: -90 });
        bullets.push({ x: player.x + player.size, y: player.y, vx: 550, vy: 0 });
        bullets.push({ x: player.x + player.size, y: player.y, vx: 500, vy: 90 });
    } else {
        bullets.push({ x: player.x + player.size, y: player.y, vx: 550, vy: 0 });
    }
}

function update(dt) {
    if (gameOver) return;

    if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y -= player.speed * dt;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y += player.speed * dt;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.speed * dt;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed * dt;

    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));

    if (keys[' '] || keys['k'] || keys['K']) shoot();

    if (player.tripleShotTimer > 0) {
        player.tripleShotTimer -= dt;
        if (player.tripleShotTimer <= 0) updateHUD();
    }

    stars.forEach(s => {
        s.x -= s.speed * dt;
        if (s.x < 0) s.x = canvas.width;
    });

    if (Math.random() < 1.4 * dt) spawnEnemy();
    if (Math.random() < 0.1 * dt) spawnPowerup();

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        if (e.isHoming) e.vy = Math.sign(player.y - e.y) * 55;

        e.x += e.vx * dt;
        e.y += e.vy * dt;

        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (b.x > e.x && b.x < e.x + e.width && b.y > e.y && b.y < e.y + e.height) {
                e.hp--;
                bullets.splice(j, 1);
                createExplosion(b.x, b.y, '#ffff00', 4);

                if (e.hp <= 0) {
                    createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.isHoming ? '#ff0055' : '#ffaa00', 10);
                    AudioSys.explosion();
                    score += e.isHoming ? 25 : 10;
                    scoreEl.textContent = score;
                    enemies.splice(i, 1);
                    break;
                }
            }
        }

        if (!enemies[i]) continue;

        if (
            player.x + player.size > e.x && player.x - player.size < e.x + e.width &&
            player.y + player.size > e.y && player.y - player.size < e.y + e.height
        ) {
            createExplosion(e.x, e.y, '#ff0000', 12);
            enemies.splice(i, 1);

            if (player.shield) {
                player.shield = false;
                AudioSys.hit();
                updateHUD();
            } else {
                lives--;
                AudioSys.explosion();
                updateHUD();
                if (lives <= 0) endGame();
            }
            continue;
        }

        if (e.x + e.width < 0) enemies.splice(i, 1);
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
        let p = powerups[i];
        p.x += p.vx * dt;

        if (Math.hypot(player.x - p.x, player.y - p.y) < player.size + p.radius) {
            AudioSys.powerup();
            if (p.type === 'shield') player.shield = true;
            if (p.type === 'life') lives = Math.min(lives + 1, 5);
            if (p.type === 'triple') player.tripleShotTimer = 8.0;

            updateHUD();
            powerups.splice(i, 1);
            continue;
        }

        if (p.x < -20) powerups.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const style = getComputedStyle(document.body);
    const playerColor = style.getPropertyValue('--player-color').trim();
    const accentColor = style.getPropertyValue('--accent-color').trim();
    const bulletColor = style.getPropertyValue('--bullet-color').trim();
    const textColor = style.getPropertyValue('--text-color').trim();

    ctx.fillStyle = textColor;
    stars.forEach(s => {
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1.0;

    if (!gameOver) {
        if (player.shield) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.moveTo(player.x + player.size, player.y);
        ctx.lineTo(player.x - player.size, player.y - player.size / 1.4);
        ctx.lineTo(player.x - player.size + 4, player.y);
        ctx.lineTo(player.x - player.size, player.y + player.size / 1.4);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = bulletColor;
    bullets.forEach(b => ctx.fillRect(b.x, b.y - 2, 10, 4));

    enemies.forEach(e => {
        ctx.fillStyle = e.isHoming ? accentColor : '#ff8800';
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(e.x + 4, e.y + 4, e.width - 8, e.height - 8);
    });

    powerups.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.type === 'shield' ? '#00ffff' : (p.type === 'life' ? '#ff0055' : '#ffff00');
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type[0].toUpperCase(), p.x, p.y);
    });

    particles.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.life / pt.maxLife;
        ctx.fillRect(pt.x, pt.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;
}

function updateHUD() {
    scoreEl.textContent = score;
    livesEl.textContent = '❤️'.repeat(Math.max(0, lives));

    let status = [];
    if (player.shield) status.push('🛡️ Escudo');
    if (player.tripleShotTimer > 0) status.push(`⚡ Triplo (${Math.ceil(player.tripleShotTimer)}s)`);
    powerupStatusEl.textContent = status.length > 0 ? status.join(' | ') : 'Nenhum';
}

function gameLoop(time) {
    if (!lastTime) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    update(dt);
    draw();

    if (!gameOver) animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    AudioSys.init();
    score = 0;
    lives = 3;
    bullets = [];
    enemies = [];
    powerups = [];
    particles = [];
    player.x = 80;
    player.y = canvas.height / 2;
    player.shield = false;
    player.tripleShotTimer = 0;
    
    updateHUD();
    gameOver = false;
    overlay.style.display = 'none';
    lastTime = 0;
    
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameOver = true;
    cancelAnimationFrame(animationId);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('arcade_highscore', highScore);
        highScoreEl.textContent = highScore;
    }

    overlayTitle.textContent = 'FIM DE JOGO';
    overlaySub.textContent = `Pontuação: ${score} | Recorde: ${highScore}`;
    startBtn.textContent = 'Jogar Novamente';
    overlay.style.display = 'flex';
}

startBtn.addEventListener('click', startGame);
