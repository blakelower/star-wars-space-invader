const KEY_CODE_LEFT = 37;   //ARROW KEYS - Line 1-4. 
const KEY_CODE_RIGHT = 39;
const KEY_CODE_SPACE = 32;
const KEY_CODE_PAUSE = 80;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const PLAYER_WIDTH = 20;
const PLAYER_MAX_SPEED = 600.0;
const LASER_MAX_SPEED = 300.0;
const LASER_COOLDOWN = 0.5;

const ENEMIES_PER_ROW = 10;
const ENEMY_HORIZONTAL_PADDING = 80;
const ENEMY_VERTICAL_PADDING = 70;
const ENEMY_VERTICAL_SPACING = 80;
const ENEMY_COOLDOWN = 5.0;

const GAME_STATE = { //glolbal variable, contains the state of the game
  lastTime: Date.now(),
  leftPressed: false,
  rightPressed: false,
  spacePressed: false,
  pausePressed: false,
  playerX: 0,
  playerY: 0,
  playerCooldown: 0,  //cooldown is for the lasers to cool down before excessive hits
  lasers: [],
  enemies: [],
  enemyLasers: [],
  gameOver: false
};

var lives=0;
var score=0;

function rectsIntersect(r1, r2) {  //imaine the enemy is a rectangle and so is the laser.. what this function is is for showing intersection between the enemy and laser rect. shapes
  return !(
    r2.left > r1.right ||  //if these conditions are not meant then they must be intersecting 
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function setPosition(el, x, y) {   //setPoistion is a universal code for the enemies as well, instead of constantly writing the position out of the enermies. 
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function clamp(v, min, max) {  
  //What is clamping? I wrote a function-
  //called clamp this is for the hero to-
  //not go off the screen
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  } else {
    return v;
  }
}

function rand(min, max) {
  if (min === undefined) min = 0;
  if (max === undefined) max = 1;
  return min + Math.random() * (max - min);
}

function createPlayer($container) {
  GAME_STATE.playerX = GAME_WIDTH / 2; //poistion of the player
  GAME_STATE.playerY = GAME_HEIGHT - 50; 
  const $player = document.createElement("img"); //simple DOM for the game, postion image etc. 
  $player.src = "img/unnamed.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function destroyPlayer($container, player) {
  $container.removeChild(player);
  GAME_STATE.gameOver = true;
  const audio = new Audio("sound/laser.ogg");
  audio.play();
}

function updatePlayer(dt, $container) {  //dt is Delta Time (one value in a relation to another) 
  if (GAME_STATE.leftPressed) {
    GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED;
  }
  if (GAME_STATE.rightPressed) {
    GAME_STATE.playerX += dt * PLAYER_MAX_SPEED;
  }

  GAME_STATE.playerX = clamp( 
    //using clamp for game_width - player_width 
    //clamp was used for smooth movement as well
    GAME_STATE.playerX,
    PLAYER_WIDTH,
    GAME_WIDTH - PLAYER_WIDTH
  );

  if (GAME_STATE.spacePressed && GAME_STATE.playerCooldown <= 0) { //Only if the cooldown is equal or smaller than 0 is when we can fire.
    createLaser($container, GAME_STATE.playerX, GAME_STATE.playerY);
    GAME_STATE.playerCooldown = LASER_COOLDOWN; 
  }
  if (GAME_STATE.playerCooldown > 0) { //after the condion we check if playercooldown is larger than 0
    GAME_STATE.playerCooldown -= dt; //by subtracting by dt we assure that the value of the laser is in seconds
  }

  const player = document.querySelector(".player");
  setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function createLaser($container, x, y) {   //simple mix between dom and js this is for the axis, image and audio. 
  const $element = document.createElement("img");
  $element.src = "img/laser-blue-1.png";
  $element.className = "laser";
  $container.appendChild($element);
  const laser = { x, y, $element };
  GAME_STATE.lasers.push(laser); //method for the laser. 
  const audio = new Audio("sound/laser.ogg");
  audio.play();
  setPosition($element, x, y);
}

function updateLasers(dt, $container) {
  const lasers = GAME_STATE.lasers;
  for (let i = 0; i < lasers.length; i++) { //loop 
    const laser = lasers[i];
    laser.y -= dt * LASER_MAX_SPEED; //to move our lasers up we have to subtract the y from lasers max speed
    if (laser.y < 0) {
      destroyLaser($container, laser); //destroylasers is for the axis of y, when the laser hits the opponent it dies/goes off the screen.
    }
    setPosition(laser.$element, laser.x, laser.y);
    const r1 = laser.$element.getBoundingClientRect();
    const enemies = GAME_STATE.enemies;
    for (let j = 0; j < enemies.length; j++) {
      const enemy = enemies[j];
      if (enemy.isDead) continue;
      const r2 = enemy.$element.getBoundingClientRect();
      if (rectsIntersect(r1, r2)) {
        // Enemy was hit
        destroyEnemy($container, enemy);
        destroyLaser($container, laser);
        break;
      }
    }
  }
  GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead); //checks if element isdead
}

// //rename to make sense
function destroyLaser($container, laser) {
  $container.removeChild(laser.$element);
  laser.isDead = true; //mark the opponent is dead by setting it to true. 
}

function createEnemy($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "img/tiee.png";
  $element.className = "enemy";
  $container.appendChild($element);
  const enemy = {
    x,
    y,
    cooldown: rand(0.5, ENEMY_COOLDOWN),
    $element
  };
  GAME_STATE.enemies.push(enemy);
  setPosition($element, x, y);
}

function updateEnemies(dt, $container) {  //gives functionality to the enemies. 
  const dx = Math.sin(GAME_STATE.lastTime / 1000.0) * 50; //this is for rotation 
  const dy = Math.cos(GAME_STATE.lastTime / 1000.0) * 10; //this is for rotation 

  const enemies = GAME_STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const x = enemy.x + dx;
    const y = enemy.y + dy;
    setPosition(enemy.$element, x, y);
    enemy.cooldown -= dt;
    if (enemy.cooldown <= 0) {
      createEnemyLaser($container, x, y);
      enemy.cooldown = ENEMY_COOLDOWN;
    }
  }
  GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead);
}

function destroyEnemy($container, enemy) {
  $container.removeChild(enemy.$element);
  enemy.isDead = true;
  score += 50;
  document.getElementById('score').innerHTML = score;
  document.getElementById('total').innerHTML = score;
}

function createEnemyLaser($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "img/missile2.png";
  $element.className = "enemy-laser";
  $container.appendChild($element);
  const laser = { x, y, $element };
  GAME_STATE.enemyLasers.push(laser);
  setPosition($element, x, y);
}

function updateEnemyLasers(dt, $container) {
  const lasers = GAME_STATE.enemyLasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.y += dt * LASER_MAX_SPEED;
    if (laser.y > GAME_HEIGHT) {
      destroyLaser($container, laser);
    }
    setPosition(laser.$element, laser.x, laser.y);
    const r1 = laser.$element.getBoundingClientRect();
    const player = document.querySelector(".player");
    const r2 = player.getBoundingClientRect();
    if (rectsIntersect(r1, r2)) {
      // Player was hit
      lives -= 1;
      document.getElementById('lives').innerHTML = lives;
      destroyLaser($container, laser);
      if(lives == 0){
        destroyPlayer($container, player);
        break;
      }
    }
  }
  GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(e => !e.isDead);
}

function init() {
  lives = 5;
  score = 0;
  document.getElementById('lives').innerHTML = lives;
  document.getElementById('score').innerHTML = score;
  const $container = document.querySelector(".game"); //the $ sign is not j-query, its for convention. Allows me to distinguish between number, list and items. It just refers bak to DOM elements
  createPlayer($container);

  const enemySpacing =  //all this is is some spacing and simple math
    (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) / (ENEMIES_PER_ROW - 1);
  for (let j = 0; j < 3; j++) {
    const y = ENEMY_VERTICAL_PADDING + j * ENEMY_VERTICAL_SPACING;
    for (let i = 0; i < ENEMIES_PER_ROW; i++) {
      const x = i * enemySpacing + ENEMY_HORIZONTAL_PADDING;
      createEnemy($container, x, y);
    }
  }
}

function playerHasWon() {
  return GAME_STATE.enemies.length === 0;
}

function update(e) {
  const currentTime = Date.now(); //took the date.now and converted it to delta time on line 262. 
  const dt = (currentTime - GAME_STATE.lastTime) / 1000.0;

  if (GAME_STATE.gameOver) {
    document.querySelector(".game-over").style.display = "block";
    return;
  }

  if (playerHasWon()) {
    document.querySelector(".congratulations").style.display = "block";
    return;
  }
  if (GAME_STATE.pausePressed) {
    document.querySelector(".pause").style.display = "block";
    return;
  } if (GAME_STATE.pausePressed) {
    document.querySelector(".btn").style.display = "block";
    return;
  }

  const $container = document.querySelector(".game");
  updatePlayer(dt, $container); //we use deltatime and the query selecror for firing lasers.
  updateLasers(dt, $container); 
  updateEnemies(dt, $container);
  updateEnemyLasers(dt, $container);

  GAME_STATE.lastTime = currentTime;
  window.requestAnimationFrame(update);
}

function onKeyDown(e) {                                           
  //writing a condition for the key 
  if (e.keyCode === KEY_CODE_LEFT) {  
    GAME_STATE.leftPressed = true;
  } else if (e.keyCode === KEY_CODE_RIGHT) {
    GAME_STATE.rightPressed = true;
  } else if (e.keyCode === KEY_CODE_SPACE) {
    GAME_STATE.spacePressed = true;
  } else if (e.keyCode === KEY_CODE_PAUSE) {
    GAME_STATE.pausePressed = true;
  }
}

function onKeyUp(e) {
  if (e.keyCode === KEY_CODE_LEFT) {
    GAME_STATE.leftPressed = false;
  } else if (e.keyCode === KEY_CODE_RIGHT) {
    GAME_STATE.rightPressed = false;
  } else if (e.keyCode === KEY_CODE_SPACE) {
    GAME_STATE.spacePressed = false;
  } else if (e.keyCode === KEY_CODE_PAUSE) {
      GAME_STATE.pausePressed = false;
  }
}

init();
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.requestAnimationFrame(update);
