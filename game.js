/* ==========================================================================
   INICIALIZAÇÃO & VARIÁVEIS GLOBAIS
   ========================================================================== */
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

let score = 0;
let highScore = localStorage.getItem('arcade_highscore') || 0;
let lives = 3;
let gameOver = true;
let animationId;
let lastTime = 0;

highScoreEl.textContent = highScore;

// Controle de Temas
themeSelect.addEventListener('change', (e) => {
    document.body.setAttribute('data-theme', e.target.value);
});

/* ==========================================================================
   GERENCIADOR DE ÁUDIO (SINTETIZADOR WEB AUDIO API)
   ========================================================================== */
const AudioSys = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    playTone(freq, type, duration, vol = 0.1) {
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
    shoot() { this.playTone(800, 'square', 0.08, 0.05); },
    explosion() { this.playTone(100, 'sawtooth', 0.25, 0.15); },
    powerup() { this.playTone(1200, 'sine', 0.2, 0.1); },
    hit() { this.playTone(250, 'triangle', 0.15, 0.1); }
};

/* ==========================================================================
   ESTRUTURAS DO JOGO (JOGADOR, TIROS, INIMIGOS, POWER-UPS, PARTÍCULAS)
   ========================================================================== */
const player = {
    x: 80,
    y: canvas.height / 2,
    size: 18,
    speed: 350, // Pixels por segundo
    shield: false,
    tripleShotTimer: 0,
    lastShot: 0,
    fireRate: 0.15 // Intervalo mínimo de tiro
};

let keys = {};
let bullets = [];
let enemies = [];
let powerups = [];
let particles = [];
let stars = [];

// Inicialização das Estrelas do Fundo (Starfield)
for (let i = 0; i < 60; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 80 + 20
    });
}

// Eventos de Teclado
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

/* ==========================================================================
   LÓGICA DE GERACÃO E ATUALIZAÇÃO DE ENTIDADES
   ========================================================================== */
function spawnEnemy() {
    const isHoming = Math.random() < 0.25; // 25% de chance de ser perseguição
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
    const chosenType = types[Math.floor(Math.random() * types.length)];
    powerups.push({
        x: canvas.width + 20,
        y: Math.random() * (canvas.height - 40) + 20,
        radius: 12,
        type: chosenType,
        vx: -100
    });
}

function createExplosion(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 150 + 50;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.4,
            maxLife: 0.4,
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
        bullets.push({ x: player.x + player.size, y: player.y, vx: 500, vy: -100 });
        bullets.push({ x: player.x + player.size, y: player.y, vx: 550, vy: 0 });
        bullets.push({ x: player.x + player.size, y: player.y, vx: 500, vy: 100 });
    } else {
        bullets.push({ x: player.x + player.size, y: player.y, vx: 550, vy: 0 });
    }
}

/* ==========================================================================
   LOOP DE ATUALIZAÇÃO DA FÍSICA (DELTA TIME OTIMIZADO)
   ========================================================================== */
function update(dt) {
    if (gameOver) return;

    // Movimentação do Jogador
    if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y -= player.speed * dt;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y += player.speed * dt;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.speed * dt;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed * dt;

    // Limites da Tela
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));

    // Ação de Atirar
    if (keys[' '] || keys['k'] || keys['K']) {
        shoot();
    }

    // Contadores de Tempo de Power-up
    if (player.tripleShotTimer > 0) {
        player.tripleShotTimer -= dt;
        if (player.tripleShotTimer <= 0) updateHUD();
    }

    // Atualização do Fundo (Estrelas)
    stars.forEach(s => {
        s.x -= s.speed * dt;
        if (s.x < 0) s.x = canvas.width;
    });

    // Spawns Aleatórios Otimizados
    if (Math.random() < 1.5 * dt) spawnEnemy();
    if (Math.random() < 0.1 * dt) spawnPowerup();

    // Atualizar Tiros
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }

    // Atualizar Inimigos & Colisão com Tiros
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];

        // Lógica de Perseguição Simples (Homing)
        if (e.isHoming) {
            let dy = player.y - e.y;
            e.vy = Math.sign(dy) * 60;
        }

        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // Colisão Tiro vs Inimigo
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (
                b.x > e.x && b.x < e.x + e.width &&
                b.y > e.y && b.y < e.y + e.height
            ) {
                e.hp--;
                bullets.splice(j, 1);
                createExplosion(b.x, b.y, '#ffff00', 4);

                if (e.hp <= 0) {
                    createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.isHoming ? '#ff0055' : '#ffaa00', 12);
                    AudioSys.explosion();
                    score += e.isHoming ? 25 : 10;
                    scoreEl.textContent = score;
                    enemies.splice(i, 1);
                    break;
                }
            }
        }

        if (!enemies[i]) continue;

        // Colisão Inimigo vs Jogador
        if (
            player.x + player.size > e.x &&
            player.x - player.size < e.x + e.width &&
            player.y + player.size > e.y &&
            player.y - player.size < e.y + e.height
        ) {
            createExplosion(e.x, e.y, '#ff0000', 15);
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

        // Remover inimigos fora da tela
        if (e.x + e.width < 0) enemies.splice(i, 1);
    }

    // Atualizar e Coletar Power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        let p = powerups[i];
        p.x += p.vx * dt;

        let dist = Math.hypot(player.x - p.x, player.y - p.y);
        if (dist < player.size + p.radius) {
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

    // Atualizar Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) particles.splice(i, 1);
    }
}

/* ==========================================================================
   RENDERIZAÇÃO GRÁFICA (CANVAS COMPATÍVEL COM TODOS OS TEMAS)
   ========================================================================== */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const style = getComputedStyle(document.body);
    const playerColor = style.getPropertyValue('--player-color').trim();
    const accentColor = style.getPropertyValue('--accent-color').trim();
    const bulletColor = style.getPropertyValue('--bullet-color').trim();
    const textColor = style.getPropertyValue('--text-color').trim();

    // Starfield
    ctx.fillStyle = textColor;
    stars.forEach(s => {
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1.0;

    if (!gameOver) {
        // Escudo Visual
        if (player.shield) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Nave do Jogador
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.moveTo(player.x + player.size, player.y);
        ctx.lineTo(player.x - player.size, player.y - player.size / 1.4);
        ctx.lineTo(player.x - player.size + 4, player.y);
        ctx.lineTo(player.x - player.size, player.y + player.size / 1.4);
        ctx.closePath();
        ctx.fill();
    }

    // Tiros
    ctx.fillStyle = bulletColor;
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y - 2, 10, 4);
    });

    // Inimigos
    enemies.forEach(e => {
        ctx.fillStyle = e.isHoming ? accentColor : '#ff8800';
        ctx.fillRect(e.x, e.y, e.width, e.height);
        
        // Detalhe Inimigo
        ctx.fillStyle = '#000';
        ctx.fillRect(e.x + 4, e.y + 4, e.width - 8, e.height - 8);
    });

    // Power-ups
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

    // Partículas
    particles.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.life / pt.maxLife;
        ctx.fillRect(pt.x, pt.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;
}

/* ==========================================================================
   GERENCIAMENTO DE ESTADO E HUD
   ========================================================================== */
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
    const dt = Math.min((time - lastTime) / 1000, 0.1); // Limitador de Delta Time
    lastTime = time;

    update(dt);
    draw();

    if (!gameOver) {
        animationId = requestAnimationFrame(gameLoop);
    }
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
