const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let enemySpawnInterval;
let difficultyInterval;

// Images
const playerImg = new Image();
playerImg.src = 'assets/player.svg';
const enemyImg = new Image();
enemyImg.src = 'assets/enemy.svg';
const enemyFastImg = new Image();
enemyFastImg.src = 'assets/enemy_fast.svg';
const bulletImg = new Image();
bulletImg.src = 'assets/bullet.svg';
const powerUpImg = new Image();
powerUpImg.src = 'assets/powerup.svg';

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    fireRate: 250, // in milliseconds
    lastShot: 0
};

// Bullets
const bullets = [];
const bulletSpeed = 7;

// Enemies
const enemies = [];
const enemyWidth = 50;
const enemyHeight = 50;
let enemySpeed = 2;
let enemySpawnRate = 2000; // in milliseconds

// Power-ups
const powerUps = [];
const powerUpWidth = 30;
const powerUpHeight = 30;
const powerUpSpeed = 3;

// Explosions
const explosions = [];

// Sounds
const shootSound = new Audio('https://www.soundjay.com/button/sounds/button-16.mp3');
const explosionSound = new Audio('https://www.soundjay.com/button/sounds/button-10.mp3');
const backgroundMusic = new Audio('https://www.soundjay.com/button/sounds/button-7.mp3');
backgroundMusic.loop = true;

// --- Drawing functions ---
function drawPlayer() {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

function drawBullets() {
    for (const bullet of bullets) {
        ctx.drawImage(bulletImg, bullet.x, bullet.y, 5, 10);
    }
}

function drawEnemies() {
    for (const enemy of enemies) {
        const img = enemy.type === 'fast' ? enemyFastImg : enemyImg;
        ctx.drawImage(img, enemy.x, enemy.y, enemyWidth, enemyHeight);
    }
}

function drawPowerUps() {
    for (const powerUp of powerUps) {
        ctx.drawImage(powerUpImg, powerUp.x, powerUp.y, powerUpWidth, powerUpHeight);
    }
}

function drawExplosions() {
    for (const explosion of explosions) {
        ctx.fillStyle = `rgba(255, 165, 0, ${explosion.alpha})`;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- Game logic ---
function movePlayer() {
    player.x += player.dx;

    // Wall detection
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

function moveBullets() {
    for (const bullet of bullets) {
        bullet.y -= bulletSpeed;
    }
}

function moveEnemies() {
    for (const enemy of enemies) {
        enemy.y += enemy.speed;
    }
}

function movePowerUps() {
    for (const powerUp of powerUps) {
        powerUp.y += powerUpSpeed;
    }
}

function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.radius += 2;
        explosion.alpha -= 0.05;
        if (explosion.alpha <= 0) {
            explosions.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    const x = Math.random() * (canvas.width - enemyWidth);
    const y = -enemyHeight;
    const type = Math.random() < 0.2 ? 'fast' : 'normal';
    const speed = type === 'fast' ? enemySpeed * 2 : enemySpeed;
    enemies.push({ x, y, type, speed });
}

function spawnPowerUp() {
    const x = Math.random() * (canvas.width - powerUpWidth);
    const y = -powerUpHeight;
    powerUps.push({ x, y });
}

function detectCollisions() {
    // Bullet-Enemy collision
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const bullet = bullets[i];
            const enemy = enemies[j];

            if (
                bullet && enemy &&
                bullet.x < enemy.x + enemyWidth &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemyHeight &&
                bullet.y + 10 > enemy.y
            ) {
                explosionSound.play();
                explosions.push({ x: enemy.x + enemyWidth / 2, y: enemy.y + enemyHeight / 2, radius: 10, alpha: 1 });
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score++;
            }
        }
    }

    // Player-Enemy collision
    for (const enemy of enemies) {
        if (
            player.x < enemy.x + enemyWidth &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemyHeight &&
            player.y + player.height > enemy.y
        ) {
            gameState = 'gameOver';
            backgroundMusic.pause();
        }
    }

    // Player-PowerUp collision
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (
            player.x < powerUp.x + powerUpWidth &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUpHeight &&
            player.y + player.height > powerUp.y
        ) {
            player.fireRate = 100; // Faster fire rate
            powerUps.splice(i, 1);
            setTimeout(() => {
                player.fireRate = 250; // Reset fire rate after 5 seconds
            }, 5000);
        }
    }
}

function increaseDifficulty() {
    if (enemySpawnRate > 500) {
        enemySpawnRate -= 100;
        clearInterval(enemySpawnInterval);
        enemySpawnInterval = setInterval(spawnEnemy, enemySpawnRate);
    }
    if (enemySpeed < 5) {
        enemySpeed += 0.1;
    }
}

function update() {
    if (gameState !== 'playing') {
        return;
    }

    movePlayer();
    moveBullets();
    moveEnemies();
    movePowerUps();
    updateExplosions();
    detectCollisions();

    // Remove off-screen bullets, enemies and powerups
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (powerUps[i].y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

function drawStartScreen() {
    ctx.fillStyle = 'white';
    ctx.font = '30px "Press Start 2P"';
    ctx.fillText('Shooting Game', canvas.width / 2 - 200, canvas.height / 2 - 40);
    ctx.font = '20px "Press Start 2P"';
    ctx.fillText('Click to Start', canvas.width / 2 - 150, canvas.height / 2);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'white';
    ctx.font = '40px "Press Start 2P"';
    ctx.fillText('Game Over', canvas.width / 2 - 150, canvas.height / 2 - 40);
    ctx.font = '20px "Press Start 2P"';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 120, canvas.height / 2);
    ctx.fillText('Click to Restart', canvas.width / 2 - 150, canvas.height / 2 + 40);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'start') {
        drawStartScreen();
        return;
    }

    if (gameState === 'gameOver') {
        drawGameOverScreen();
        return;
    }

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawPowerUps();
    drawExplosions();

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '20px "Press Start 2P"';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

function restart() {
    score = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
    player.fireRate = 250;
    bullets.length = 0;
    enemies.length = 0;
    powerUps.length = 0;
    explosions.length = 0;
    enemySpeed = 2;
    enemySpawnRate = 2000;
    gameState = 'playing';
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
    enemySpawnInterval = setInterval(spawnEnemy, enemySpawnRate);
    difficultyInterval = setInterval(increaseDifficulty, 5000);
    setInterval(spawnPowerUp, 10000); // Spawn a power-up every 10 seconds
}

// --- Game loop ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Event listeners ---
function keyDown(e) {
    if (gameState !== 'playing') {
        return;
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = player.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        player.dx = -player.speed;
    } else if (e.key === ' ' || e.key === 'Spacebar') {
        const now = new Date().getTime();
        if (now - player.lastShot > player.fireRate) {
            shootSound.play();
            bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y });
            player.lastShot = now;
        }
    }
}

function keyUp(e) {
    if (
        e.key === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'ArrowLeft' ||
        e.key === 'a'
    ) {
        player.dx = 0;
    }
}

function mouseDown(e) {
    if (gameState === 'start' || gameState === 'gameOver') {
        restart();
    }
}

// --- Start game ---
window.onload = () => {
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);
    canvas.addEventListener('mousedown', mouseDown);
    gameLoop();
};