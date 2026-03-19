/*
// ----------------------
// Popup system (ADDED)
// ----------------------
let gamePaused = true;

function showPopup(title, text) {
    document.getElementById("popup-title").innerText = title;
    document.getElementById("popup-text").innerText = text;
    document.getElementById("popup").classList.remove("hidden");
    gamePaused = true;
}

function closePopup() {
    document.getElementById("popup").classList.add("hidden");
    gamePaused = false;
}

// ----------------------
// Canvas setup
// ----------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ----------------------
// Player images (UPDATED)
// ----------------------
const playerImages = [];

const img1 = new Image();
img1.src = "player1.png";
playerImages.push(img1);

const img2 = new Image();
img2.src = "player2.png";
playerImages.push(img2);

const img3 = new Image();
img3.src = "player3.png";
playerImages.push(img3);

const enemyImages = [];

const enemy1 = new Image();
enemy1.src = "Enemy1.png"; // used for level 1 & 2
enemyImages.push(enemy1);

const enemy2 = new Image();
enemy2.src = "Enemy2.png"; // used for level 3
enemyImages.push(enemy2);

// ----------------------
// Keyboard input
// ----------------------
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};
document.addEventListener("keydown", e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
document.addEventListener("keyup", e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

// ----------------------
// Maze & grid settings
// ----------------------
const cellSize = 40;
const cols = Math.floor(canvas.width / cellSize);
const rows = Math.floor(canvas.height / cellSize);
let mazeGrid = [];
let walls = [];

// ----------------------
// Levels
// ----------------------
let level = 1;
let score = 0;
const levels = [
    { required: 5, speed: 2, enemies: 5 },
    { required: 10, speed: 3, enemies: 7 },
    { required: 15, speed: 4, enemies: 9 }
];

// ----------------------
// Player
// ----------------------
let player = {
    x: 0,
    y: 0,
    size: 30,
    speed: 3
};

// ----------------------
// Enemies
// ----------------------
let enemies = [];

// ----------------------
// Infection replication system
// ----------------------
let replicationTimer = 0;
let replicationInterval = 300;

// ----------------------
// Level 3 containment win system
// ----------------------
let containmentTimer = 0;
let containmentGoal = 45 * 60;
let containmentThreshold = 12;
let gameWon = false;

// ----------------------
// Maze generation
// ----------------------
function generateMaze() {
    mazeGrid = Array(rows).fill().map(() => Array(cols).fill(1));
    function shuffle(array) { for (let i = array.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [array[i],array[j]]=[array[j],array[i]]; } return array; }
    function carve(x,y){
        mazeGrid[y][x]=0;
        const dirs = shuffle([[0,-1],[1,0],[0,1],[-1,0]]);
        for (let [dx,dy] of dirs){
            let nx = x + dx*2, ny = y + dy*2;
            if(ny>=0 && ny<rows && nx>=0 && nx<cols && mazeGrid[ny][nx]===1){
                mazeGrid[y+dy][x+dx]=0;
                carve(nx,ny);
            }
        }
    }
    carve(1,1);
    walls=[];
    for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
            if(mazeGrid[r][c]===1) walls.push({x:c*cellSize,y:r*cellSize,width:cellSize,height:cellSize});
        }
    }
}

// ----------------------
// Player start
// ----------------------
function getPlayerStartPosition(){
    for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
            if(mazeGrid[r][c]===0){
                return {x:c*cellSize+(cellSize-player.size)/2,y:r*cellSize+(cellSize-player.size)/2};
            }
        }
    }
    return {x:20,y:20};
}

// ----------------------
// Random open position
// ----------------------
function getRandomOpenPosition(size){
    let attempts=0;
    while(attempts++<1000){
        const r=Math.floor(Math.random()*rows);
        const c=Math.floor(Math.random()*cols);
        if(mazeGrid[r][c]===0)
            return {x:c*cellSize+(cellSize-size)/2, y:r*cellSize+(cellSize-size)/2};
    }
    return {x:canvas.width/2, y:canvas.height/2};
}

// ----------------------
// Spawn enemies
// ----------------------
function spawnEnemies(levelIndex){
    enemies=[];

    const initialCount = 3 + levelIndex * 2;

    for(let i=0;i<initialCount;i++){
        const pos=getRandomOpenPosition(30);
        enemies.push({
            x:pos.x,
            y:pos.y,
            size:30,
            speed:levels[levelIndex].speed,
            dx:Math.random()<0.5?1:-1,
            dy:Math.random()<0.5?1:-1
        });
    }

    replicationInterval = 300 - (levelIndex * 60);
    replicationTimer = 0;
    containmentTimer = 0;
}

// ----------------------
// Setup level
// ----------------------
function setupLevel(levelIndex){
    generateMaze();
    const playerPos=getPlayerStartPosition();
    player.x=playerPos.x;
    player.y=playerPos.y;
    spawnEnemies(levelIndex);
}

// ----------------------
// Draw functions
// ----------------------
function drawWalls(){ ctx.fillStyle="gray"; walls.forEach(w=>ctx.fillRect(w.x,w.y,w.width,w.height)); }

function drawPlayer(){
    const drawSize = 36;
    const offset = (drawSize - player.size) / 2;

    const currentImg = playerImages[level - 1];

    if (currentImg && currentImg.complete) {
        ctx.drawImage(currentImg, player.x - offset, player.y - offset, drawSize, drawSize);
    } else {
        ctx.fillStyle = "green";
        ctx.fillRect(player.x, player.y, player.size, player.size);
    }
}

function drawEnemies(){
    enemies.forEach(e => {

        let currentImg;
        if (level === 3) {
            currentImg = enemyImages[1];
        } else {
            currentImg = enemyImages[0];
        }

        if (currentImg && currentImg.complete && currentImg.naturalWidth !== 0) {
            ctx.drawImage(currentImg, e.x, e.y, e.size, e.size);
        } else {
            ctx.fillStyle = "red";
            ctx.fillRect(e.x, e.y, e.size, e.size);
        }
    });
}

function drawScore(){ 
    ctx.fillStyle="white"; 
    ctx.font="20px Arial"; 
    ctx.fillText("Score: "+score,10,25); 
    ctx.fillText("Level: "+level,10,50);
    ctx.fillText("Pathogen: "+enemies.length,10,75);
}

// ----------------------
// Collision detection
// ----------------------
function checkWallCollision(rect){
    for(let w of walls){
        if(rect.x<w.x+w.width && rect.x+rect.size>w.x &&
           rect.y<w.y+w.height && rect.y+rect.size>w.y)
            return true;
    }
    return false;
}

// ----------------------
// Move enemies
// ----------------------
function moveEnemy(enemy) {

    let nextX = enemy.x + enemy.dx * enemy.speed;
    let nextY = enemy.y + enemy.dy * enemy.speed;

    if (checkWallCollision({ ...enemy, x: nextX, y: nextY })) {

        const possibleDirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        const validDirs = possibleDirs.filter(dir => {
            const testX = enemy.x + dir.dx * enemy.speed;
            const testY = enemy.y + dir.dy * enemy.speed;
            return !checkWallCollision({ ...enemy, x: testX, y: testY });
        });

        if (validDirs.length > 0) {

            if (level === 1) {
                const choice = validDirs[Math.floor(Math.random() * validDirs.length)];
                enemy.dx = choice.dx;
                enemy.dy = choice.dy;
            } else {
                let bestDir = validDirs[0];
                let bestDistance = -Infinity;

                for (let dir of validDirs) {
                    const testX = enemy.x + dir.dx * enemy.speed;
                    const testY = enemy.y + dir.dy * enemy.speed;
                    const testDist = Math.sqrt(
                        (player.x - testX) ** 2 +
                        (player.y - testY) ** 2
                    );
                    if (testDist > bestDistance) {
                        bestDistance = testDist;
                        bestDir = dir;
                    }
                }
                enemy.dx = bestDir.dx;
                enemy.dy = bestDir.dy;
            }
        }
    }

    enemy.x += enemy.dx * enemy.speed;
    enemy.y += enemy.dy * enemy.speed;
}

// ----------------------
// Update
// ----------------------
function update(){

    if (gamePaused) return;

    let newX=player.x;
    if(keys.ArrowLeft)newX-=player.speed;
    if(keys.ArrowRight)newX+=player.speed;
    if(!checkWallCollision({x:newX,y:player.y,size:player.size})) player.x=newX;

    let newY=player.y;
    if(keys.ArrowUp)newY-=player.speed;
    if(keys.ArrowDown)newY+=player.speed;
    if(!checkWallCollision({x:player.x,y:newY,size:player.size})) player.y=newY;

    player.x=Math.max(0,Math.min(canvas.width-player.size,player.x));
    player.y=Math.max(0,Math.min(canvas.height-player.size,player.y));

    enemies.forEach((enemy,index)=>{
        moveEnemy(enemy);

        if(player.x<enemy.x+enemy.size &&
           player.x+player.size>enemy.x &&
           player.y<enemy.y+enemy.size &&
           player.y+player.size>enemy.y){

            score++;

            enemies.splice(index,1);

            if(score>=levels[level-1].required && level<levels.length){

                level++;

                if(level === 2){
                    showPopup(
                    "Level 2: Dendritic Cell",
                    "You are now a dendritic cell, the connection between the innate and adaptive immune systems.\n\nDendritic cells phagocytose pathogens, but their main role is to process them and present antigens to T cells.\n\nThis allows the immune system to recognize and respond more specifically to the infection.\n\nObjective:\nProcess and eliminate 10 pathogens to activate the adaptive immune response."
                    );
                }

                if(level === 3){
                    showPopup(
                    "Level 3: Helper T Cell",
                    "You are now a helper T cell, a key coordinator of the adaptive immune response.\n\nHelper T cells do not directly phagocytose or destroy pathogens. Instead, they recognize antigens presented by dendritic cells and activate other immune cells to fight the infection.\n\nIn this level, the enemies you see represent infected dendritic cells presenting antigens.\n\nYour role is to identify these signals and coordinate the immune response to keep the infection under control.\n\nObjective:\nKeep pathogen levels below the danger threshold (25 pathogens) long enough to successfully control the infection.\n\nIf pathogens remain contained, the immune system wins."
                    );
                }

                setupLevel(level-1);
            }
        }
    });

    replicationTimer++;
    if(replicationTimer > replicationInterval){
        replicationTimer = 0;
        const pos=getRandomOpenPosition(30);
        enemies.push({
            x:pos.x,
            y:pos.y,
            size:30,
            speed:levels[level-1].speed,
            dx:Math.random()<0.5?1:-1,
            dy:Math.random()<0.5?1:-1
        });
    }

   if(enemies.length > 25 && !gamePaused){
    showPopup(
    "Host Overwhelmed!",
    "The pathogens multiplied faster than the immune system could control them.\n\nWhen the pathogen load becomes too high, immune defenses are unable to keep up, allowing the infection to spread throughout the host.\n\nWithout effective containment and coordination, the immune response fails, leading to severe infection.\n\nThe host has been overwhelmed."
    );

    return;
}

  if(level === 3 && !gameWon){
    if(enemies.length <= containmentThreshold){
        containmentTimer++;
    } else {
        containmentTimer = 0;
    }

    if(containmentTimer >= containmentGoal){
        gameWon = true;

        showPopup(
        "Immune System Victory!",
        "Through coordinated immune responses, the infection has been successfully controlled.\n\nMacrophages helped reduce the initial pathogen load, dendritic cells presented antigens to activate the adaptive immune system, and helper T cells coordinated a targeted response.\n\nBy keeping pathogen levels under control, the immune system was able to eliminate the threat without overwhelming the host.\n\nThe body returns to a stable, healthy state."
        );

        return;
    }
} }


// ----------------------
// Draw
// ----------------------
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawWalls();
    drawPlayer();
    drawEnemies();
    drawScore();
}

// ----------------------
// Setup
// ----------------------
setupLevel(0);

showPopup(
"Welcome to Pathogen Panic!",
"Your mission: stop invading pathogens from overwhelming the host.\n\nAs a key part of the immune system, you’ll fight through multiple stages of the body’s defense response. Each level represents a different immune cell with unique roles in protecting the body.\n\nEliminate pathogens, keep their numbers under control, and advance through the immune response.\n\nIf too many pathogens accumulate, the host will be overwhelmed!"
);

showPopup(
"Level 1: Macrophage",
"You are a macrophage, one of the first responders of the immune system.\n\nMacrophages specialize in phagocytosis, meaning they engulf and digest invading pathogens.\n\nYour job is to patrol the environment and eliminate threats before they multiply.\n\nObjective:\nPhagocytose 5 pathogens to advance to the next level."
);

// ----------------------
// Game loop
// ----------------------
function gameLoop(){ update(); draw(); requestAnimationFrame(gameLoop); }
gameLoop();
showPopup(
"Welcome to Pathogen Panic!",
"Your mission: stop invading pathogens from overwhelming the host.\n\nProgress through immune system stages:\n- Macrophage (Level 1)\n- Dendritic Cell (Level 2)\n- Helper T Cell (Level 3)\n\nEliminate pathogens and survive the infection."
);
*/
// ----------------------
// Popup system (ADDED)
// ----------------------
let gamePaused = true;
let popupQueue = [];

function showPopup(title, text) {
    document.getElementById("popup-title").innerText = title;
    document.getElementById("popup-text").innerText = text;
    document.getElementById("popup").classList.remove("hidden");
    gamePaused = true;
}

function closePopup() {
    document.getElementById("popup").classList.add("hidden");
    gamePaused = false;

    // 👉 show next popup in queue (if any)
    if (popupQueue.length > 0) {
        const next = popupQueue.shift();
        showPopup(next.title, next.text);
    }
}

// ----------------------
// Canvas setup
// ----------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ----------------------
// Player images (UPDATED)
// ----------------------
const playerImages = [];

const img1 = new Image();
img1.src = "player1.png";
playerImages.push(img1);

const img2 = new Image();
img2.src = "player2.png";
playerImages.push(img2);

const img3 = new Image();
img3.src = "player3.png";
playerImages.push(img3);

const enemyImages = [];

const enemy1 = new Image();
enemy1.src = "Enemy1.png"; // used for level 1 & 2
enemyImages.push(enemy1);

const enemy2 = new Image();
enemy2.src = "Enemy2.png"; // used for level 3
enemyImages.push(enemy2);

// ----------------------
// Keyboard input
// ----------------------
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};
document.addEventListener("keydown", e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
document.addEventListener("keyup", e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

// ----------------------
// Maze & grid settings
// ----------------------
const cellSize = 40;
const cols = Math.floor(canvas.width / cellSize);
const rows = Math.floor(canvas.height / cellSize);
let mazeGrid = [];
let walls = [];

// ----------------------
// Levels
// ----------------------
let level = 1;
let score = 0;
const levels = [
    { required: 5, speed: 2, enemies: 5 },
    { required: 10, speed: 3, enemies: 7 },
    { required: 15, speed: 4, enemies: 9 }
];

// ----------------------
// Player
// ----------------------
let player = {
    x: 0,
    y: 0,
    size: 30,
    speed: 3
};

// ----------------------
// Enemies
// ----------------------
let enemies = [];

// ----------------------
// Infection replication system
// ----------------------
let replicationTimer = 0;
let replicationInterval = 300;

// ----------------------
// Level 3 containment win system
// ----------------------
let containmentTimer = 0;
let containmentGoal = 45 * 60;
let containmentThreshold = 12;
let gameWon = false;

// ----------------------
// Maze generation
// ----------------------
function generateMaze() {
    mazeGrid = Array(rows).fill().map(() => Array(cols).fill(1));
    function shuffle(array) { for (let i = array.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [array[i],array[j]]=[array[j],array[i]]; } return array; }
    function carve(x,y){
        mazeGrid[y][x]=0;
        const dirs = shuffle([[0,-1],[1,0],[0,1],[-1,0]]);
        for (let [dx,dy] of dirs){
            let nx = x + dx*2, ny = y + dy*2;
            if(ny>=0 && ny<rows && nx>=0 && nx<cols && mazeGrid[ny][nx]===1){
                mazeGrid[y+dy][x+dx]=0;
                carve(nx,ny);
            }
        }
    }
    carve(1,1);
    walls=[];
    for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
            if(mazeGrid[r][c]===1) walls.push({x:c*cellSize,y:r*cellSize,width:cellSize,height:cellSize});
        }
    }
}

// ----------------------
// Player start
// ----------------------
function getPlayerStartPosition(){
    for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
            if(mazeGrid[r][c]===0){
                return {x:c*cellSize+(cellSize-player.size)/2,y:r*cellSize+(cellSize-player.size)/2};
            }
        }
    }
    return {x:20,y:20};
}

// ----------------------
// Random open position
// ----------------------
function getRandomOpenPosition(size){
    let attempts=0;
    while(attempts++<1000){
        const r=Math.floor(Math.random()*rows);
        const c=Math.floor(Math.random()*cols);
        if(mazeGrid[r][c]===0)
            return {x:c*cellSize+(cellSize-size)/2, y:r*cellSize+(cellSize-size)/2};
    }
    return {x:canvas.width/2, y:canvas.height/2};
}

// ----------------------
// Spawn enemies
// ----------------------
function spawnEnemies(levelIndex){
    enemies=[];

    const initialCount = 3 + levelIndex * 2;

    for(let i=0;i<initialCount;i++){
        const pos=getRandomOpenPosition(30);
        enemies.push({
            x:pos.x,
            y:pos.y,
            size:30,
            speed:levels[levelIndex].speed,
            dx:Math.random()<0.5?1:-1,
            dy:Math.random()<0.5?1:-1
        });
    }

    replicationInterval = 300 - (levelIndex * 60);
    replicationTimer = 0;
    containmentTimer = 0;
}

// ----------------------
// Setup level
// ----------------------
function setupLevel(levelIndex){
    generateMaze();
    const playerPos=getPlayerStartPosition();
    player.x=playerPos.x;
    player.y=playerPos.y;
    spawnEnemies(levelIndex);
}

// ----------------------
// Draw functions
// ----------------------
function drawWalls(){ ctx.fillStyle="gray"; walls.forEach(w=>ctx.fillRect(w.x,w.y,w.width,w.height)); }

function drawPlayer(){
    const drawSize = 36;
    const offset = (drawSize - player.size) / 2;

    const currentImg = playerImages[level - 1];

    if (currentImg && currentImg.complete) {
        ctx.drawImage(currentImg, player.x - offset, player.y - offset, drawSize, drawSize);
    } else {
        ctx.fillStyle = "green";
        ctx.fillRect(player.x, player.y, player.size, player.size);
    }
}

function drawEnemies(){
    enemies.forEach(e => {

        let currentImg;
        if (level === 3) {
            currentImg = enemyImages[1];
        } else {
            currentImg = enemyImages[0];
        }

        if (currentImg && currentImg.complete && currentImg.naturalWidth !== 0) {
            ctx.drawImage(currentImg, e.x, e.y, e.size, e.size);
        } else {
            ctx.fillStyle = "red";
            ctx.fillRect(e.x, e.y, e.size, e.size);
        }
    });
}

function drawScore(){ 
    ctx.fillStyle="white"; 
    ctx.font="20px Arial"; 
    ctx.fillText("Score: "+score,10,25); 
    ctx.fillText("Level: "+level,10,50);
    ctx.fillText("Pathogen: "+enemies.length,10,75);
}

// ----------------------
// Collision detection
// ----------------------
function checkWallCollision(rect){
    for(let w of walls){
        if(rect.x<w.x+w.width && rect.x+rect.size>w.x &&
           rect.y<w.y+w.height && rect.y+rect.size>w.y)
            return true;
    }
    return false;
}

// ----------------------
// Move enemies
// ----------------------
function moveEnemy(enemy) {

    let nextX = enemy.x + enemy.dx * enemy.speed;
    let nextY = enemy.y + enemy.dy * enemy.speed;

    if (checkWallCollision({ ...enemy, x: nextX, y: nextY })) {

        const possibleDirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        const validDirs = possibleDirs.filter(dir => {
            const testX = enemy.x + dir.dx * enemy.speed;
            const testY = enemy.y + dir.dy * enemy.speed;
            return !checkWallCollision({ ...enemy, x: testX, y: testY });
        });

        if (validDirs.length > 0) {

            if (level === 1) {
                const choice = validDirs[Math.floor(Math.random() * validDirs.length)];
                enemy.dx = choice.dx;
                enemy.dy = choice.dy;
            } else {
                let bestDir = validDirs[0];
                let bestDistance = -Infinity;

                for (let dir of validDirs) {
                    const testX = enemy.x + dir.dx * enemy.speed;
                    const testY = enemy.y + dir.dy * enemy.speed;
                    const testDist = Math.sqrt(
                        (player.x - testX) ** 2 +
                        (player.y - testY) ** 2
                    );
                    if (testDist > bestDistance) {
                        bestDistance = testDist;
                        bestDir = dir;
                    }
                }
                enemy.dx = bestDir.dx;
                enemy.dy = bestDir.dy;
            }
        }
    }

    enemy.x += enemy.dx * enemy.speed;
    enemy.y += enemy.dy * enemy.speed;
}

// ----------------------
// Update
// ----------------------
function update(){

    if (gamePaused) return;

    let newX=player.x;
    if(keys.ArrowLeft)newX-=player.speed;
    if(keys.ArrowRight)newX+=player.speed;
    if(!checkWallCollision({x:newX,y:player.y,size:player.size})) player.x=newX;

    let newY=player.y;
    if(keys.ArrowUp)newY-=player.speed;
    if(keys.ArrowDown)newY+=player.speed;
    if(!checkWallCollision({x:player.x,y:newY,size:player.size})) player.y=newY;

    player.x=Math.max(0,Math.min(canvas.width-player.size,player.x));
    player.y=Math.max(0,Math.min(canvas.height-player.size,player.y));

    enemies.forEach((enemy,index)=>{
        moveEnemy(enemy);

        if(player.x<enemy.x+enemy.size &&
           player.x+player.size>enemy.x &&
           player.y<enemy.y+enemy.size &&
           player.y+player.size>enemy.y){

            score++;

            enemies.splice(index,1);

            if(score>=levels[level-1].required && level<levels.length){

                level++;

                if(level === 2){
                    showPopup(
                    "Level 2: Dendritic Cell",
                    "You are now a dendritic cell, the connection between the innate and adaptive immune systems.\n\nDendritic cells phagocytose pathogens, but their main role is to process them and present antigens to T cells.\n\nThis allows the immune system to recognize and respond more specifically to the infection.\n\nObjective:\nProcess and eliminate 10 pathogens to activate the adaptive immune response."
                    );
                }

                if(level === 3){
                    showPopup(
                    "Level 3: Helper T Cell",
                    "You are now a helper T cell, a key coordinator of the adaptive immune response.\n\nHelper T cells do not directly phagocytose or destroy pathogens. Instead, they recognize antigens presented by dendritic cells and activate other immune cells to fight the infection.\n\nIn this level, the enemies you see represent infected dendritic cells presenting antigens.\n\nYour role is to identify these signals and coordinate the immune response to keep the infection under control.\n\nObjective:\nKeep pathogen levels below the danger threshold (25 pathogens) long enough to successfully control the infection.\n\nIf pathogens remain contained, the immune system wins."
                    );
                }

                setupLevel(level-1);
            }
        }
    });

    replicationTimer++;
    if(replicationTimer > replicationInterval){
        replicationTimer = 0;
        const pos=getRandomOpenPosition(30);
        enemies.push({
            x:pos.x,
            y:pos.y,
            size:30,
            speed:levels[level-1].speed,
            dx:Math.random()<0.5?1:-1,
            dy:Math.random()<0.5?1:-1
        });
    }

   if(enemies.length > 25 && !gamePaused){
    showPopup(
    "Host Overwhelmed!",
    "The pathogens multiplied faster than the immune system could control them.\n\nWhen the pathogen load becomes too high, immune defenses are unable to keep up, allowing the infection to spread throughout the host.\n\nWithout effective containment and coordination, the immune response fails, leading to severe infection.\n\nThe host has been overwhelmed."
    );

    return;
}

  if(level === 3 && !gameWon){
    if(enemies.length <= containmentThreshold){
        containmentTimer++;
    } else {
        containmentTimer = 0;
    }

    if(containmentTimer >= containmentGoal){
        gameWon = true;

        showPopup(
        "Immune System Victory!",
        "Through coordinated immune responses, the infection has been successfully controlled.\n\nMacrophages helped reduce the initial pathogen load, dendritic cells presented antigens to activate the adaptive immune system, and helper T cells coordinated a targeted response.\n\nBy keeping pathogen levels under control, the immune system was able to eliminate the threat without overwhelming the host.\n\nThe body returns to a stable, healthy state."
        );

        return;
    }
} }


// ----------------------
// Draw
// ----------------------
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawWalls();
    drawPlayer();
    drawEnemies();
    drawScore();
}

// ----------------------
// Setup
// ----------------------
setupLevel(0);

// queue intro sequence
popupQueue.push(
    {
        title: "Welcome to Pathogen Panic!",
        text: "Your mission: stop invading pathogens from overwhelming the host.\n\nAs a key part of the immune system, you’ll fight through multiple stages of the body’s defense response. Each level represents a different immune cell with unique roles in protecting the body.\n\nEliminate pathogens, keep their numbers under control, and advance through the immune response.\n\nIf too many pathogens accumulate, the host will be overwhelmed!"
    },
    {
        title: "Level 1: Macrophage",
        text: "You are a macrophage, one of the first responders of the immune system.\n\nMacrophages specialize in phagocytosis, meaning they engulf and digest invading pathogens.\n\nYour job is to patrol the environment and eliminate threats before they multiply.\n\nObjective:\nPhagocytose 5 pathogens to advance to the next level."
    }
);

// start first popup
const first = popupQueue.shift();
showPopup(first.title, first.text);

// ----------------------
// Game loop
// ----------------------
function gameLoop(){ update(); draw(); requestAnimationFrame(gameLoop); }
gameLoop();
