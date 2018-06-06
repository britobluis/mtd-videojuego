var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var vidas_jugador = 3;
var score = 0;

var player_width = 30;
var player_height = 40;
var player_speed = 1; //usado para incrementar las coords Y de todos los blocks, la velocidad a la que caen

var player = new Map();
player.set("X", canvas.width / 2);
player.set("Y", canvas.height - 70);
player.set("width", player_width);
player.set("height", player_height);

var balls = [];
var ball_speed = 1.6;
var since_last_fire = performance.now();

var blocks = [];
var player_block_collision_bool = true;

var monsters = [];
var monster_speed = 0.6; //velocidad a la cual se mueven los objetos que caen en el Y axis

//Esta parte maneja el presionar keys usadas para mover el personaje y disparar
var right_pressed = false;
var left_pressed = false;
var space_pressed = false;

document.addEventListener("keydown", KeyDownFunc, false);
document.addEventListener("keyup", KeyUpFunc, false);

function KeyDownFunc(e) {
  if (e.keyCode == 39) {
    right_pressed = true;
  } else if (e.keyCode == 37) {
    left_pressed = true;
  } else if (e.keyCode == 32) {
    space_pressed = true;
  }
}

function KeyUpFunc(e) {
  if (e.keyCode == 39) {
    right_pressed = false;
  } else if (e.keyCode == 37) {
    left_pressed = false;
  } else if (e.keyCode == 32) {
    space_pressed = false;
  }
}

//Dibuja el personaje
function dibujarplayer() {
  ctx.beginPath();
  ctx.rect(player.get("X"), player.get("Y"), player_width, player_height);
  ctx.fillStyle = "green";

  ctx.rect(player.get("X") + player_width / 2 - 5, player.get("Y") - 15, 10, 15);
  ctx.fillStyle = "green";

  ctx.fill();
  ctx.closePath();
}

//Dibuja los bloques de bordes
function dibujarBorder() {
  ctx.beginPath();
  ctx.rect(0, 0, 80, canvas.height);
  ctx.rect(canvas.width - 80, 0, 80, canvas.height);
  ctx.fillStyle = "grey";
  ctx.fill();
  ctx.closePath();
}

//Inicializa una nueva bola (posicion de inicio), agregandola a una lista
function dibujarNewBall(ball_X, ball_Y) {
  ctx.beginPath();
  ctx.arc(ball_X, ball_Y, 5, 0, Math.PI * 2);

  var ball = new Map();
  ball.set("X", ball_X);
  ball.set("Y", ball_Y);
  ball.set("width", 3);
  ball.set("height", 3);
  balls.push(ball);
  since_last_fire = performance.now();
}

//Dibuja todas las bolas de una lista
function dibujarBalls() {
  for (var i = 0; i < balls.length; i++) {
    ctx.beginPath();
    ctx.arc(balls[i].get("X"), balls[i].get("Y"), 5, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
  }
}

//Genera coordenadas con 80 < x < (canvas.width - 120) y con -260 < y < -60. Retorna las coordenadas.
function generarCoords() {
  do {
    var X = Math.random() * (canvas.width - 80) + 80;
  } while (X + 120 > canvas.width);

  var Y = Math.random() * (-260 - 60) - 60;
  return [X, Y];
}

//Chequea que la distancia X entre 2 bloques is mayor que 140 y la diferencia de la distancia Y-axis mayor que 40.
function distanceCheck(X1, Y1, X2, Y2) {
  var distance = Math.sqrt(Math.pow(X1 - X2, 2) + Math.pow(Y1 - Y2, 2));
  if (distance > 140 && Math.abs(Y1 - Y2) > 40) {
    return true;
  } else {
    return false;
  }
}

//Funcion que retorna TRUE si necesitamos generar nuevas coordenadas porque los bloques estan muy cercanos, sino es FALSE.
function blockDistanceChecker(X, Y) {
  if (blocks.length == 0) {
    return false;
  }

  var check = false;
  for (i = 0; i < blocks.length; i++) {
    if (distanceCheck(X, Y, blocks[i].get("X"), blocks[i].get("Y"))) {
      check = check || false;
    } else {
      check = check || true;
    }
  }

  if (!check) {
    return false;
  } else {
    return true;
  }
}

//Crea un nuevo bloque
function dibujarNewBlock() {
  do {
    var coords = generarCoords();
    var X = coords[0];
    var Y = coords[1];
  } while (blockDistanceChecker(X, Y));

  var width = 40;
  var height = 60;

  var block = new Map();
  block.set("X", X);
  block.set("Y", Y);
  block.set("width", width);
  block.set("height", height);

  blocks.push(block);
}

function dibujarBlocks() {
  for (var i = 0; i < blocks.length; i++) {
    ctx.beginPath();
    ctx.rect(blocks[i].get("X"), blocks[i].get("Y"), blocks[i].get("width"), blocks[i].get("height"));
    ctx.fillStyle = "green";
    ctx.fill();
    ctx.closePath();
  }
}

//Funcion Mover: mueve los bloques hacia abajo (y++) sobre el Y-axis
function moverFunc() {
  for (var i = 0; i < blocks.length; i++) {
    blocks[i].set("Y", blocks[i].get("Y") + player_speed);
    //Drops the block from the blocks array when they're out of view
    if (blocks[i].get("Y") > canvas.width) {
      blocks.splice(i, 1);
    }
  }
}

//Funcion Mover Bolas: mueve las bolas hacia arriba (y--) sobre el Y-axis //Agregado: Mueve a los monstruos
function moveBalls() {
  //Mueve las bolas
  for (var i = 0; i < balls.length; i++) {
    balls[i].set("Y", balls[i].get("Y") - ball_speed);
    //Elimina una bola del array de bolas cuando salen de la vista
    if (balls[i].get("Y") < 0) {
      balls.splice(i, 1);
    }
  }

  //Mueve los monstruos
  for (var j = 0; j < monsters.length; j++) {
    monsters[j].set("Y", monsters[j].get("Y") + monster_speed);
    //Elimina un monstruo del array de monstruos cuando salen de la vista
    if (monsters[j].get("Y") > canvas.width) {
      monsters.splice(j, 1);
    }
  }
}

//Funcion de deteccion de Colision de Bloques
function player_block_collision() {

  for (i = 0; i < blocks.length; i++) {
    var conflict_X = false;
    var conflict_Y = false;

    if (player.get("X") + player_width > blocks[i].get("X") && player.get("X") < blocks[i].get("X") + 40) {
      conflict_X = conflict_X || true;
    }
    if (player.get("Y") < blocks[i].get("Y") + 60 && player.get("Y") > blocks[i].get("Y")) {
      conflict_Y = conflict_Y || true;
    }
    if (conflict_X && conflict_Y) {
      player_block_collision_bool = false;
      vidas_jugador -= 1;
      return;
    }
  }
  player_block_collision_bool = true;
}

//Genera coordenadas X y Y para un nuevo monstruo
function create_monster() {
  var coords = generarCoords();
  var X = coords[0];
  var Y = coords[1];

  var monster = new Map();
  monster.set("X", X);
  monster.set("Y", Y);
  monster.set("width", 25);
  monster.set("height", 29);
  monsters.push(monster);
}

//Dibuja un monstruo
function dibujar_monster(X, Y) {
  var scale = 0.8;
  var h = 9; //height
  var a = 5;

  ctx.beginPath();
  //Primer trapezoide
  ctx.moveTo(X, Y);
  ctx.lineTo(X - a * scale, Y + h * scale);
  ctx.lineTo(X + (a * 4) * scale, Y + h * scale);
  ctx.lineTo(X + (a * 3) * scale, Y);
  //Segundo trapezoide
  ctx.moveTo(X - (a + 5) * scale, Y + h * scale);
  ctx.lineTo(X - (a) * scale, Y + (h + 20) * scale);
  ctx.lineTo(X + (a + 15) * scale, Y + (h + 20) * scale);
  ctx.lineTo(X + (a + 20) * scale, Y + (h) * scale);

  ctx.fillStyle = "purple";
  ctx.fill();
  ctx.closePath();
}

//Dibuja al monstruo en la lista de monstruos
function dibujar_monsters() {
  for (i = 0; i < monsters.length; i++) {
    var X = monsters[i].get("X");
    var Y = monsters[i].get("Y");
    dibujar_monster(X, Y);
  }
}

//Detector de Colision: detecta una colision sobre la Y-axis entre 2 objetos (Maps) con la siguiente plantilla: ["X", "Y", "width", "height"]
function collision_detector(first, second) {
  var x1 = first.get("X");
  var y1 = first.get("Y");
  var width1 = first.get("width");
  var height1 = first.get("height");
  var x2 = second.get("X");
  var y2 = second.get("Y");
  var width2 = second.get("width");
  var height2 = second.get("height");

  if (x2 > x1 && x2 < x1 + width1 || x1 > x2 && x1 < x2 + width2) {
    if (y2 > y1 && y2 < y1 + height1 || y1 > y2 && y1 < y2 + height2) {
      return true;
    }
  } else {
    return false;
  }
}

//Detecta una colision entre bolas y monstruos
function ball_monster_collision() {
  for (var i = 0; i < monsters.length; i++) {
    var monster = monsters[i];
    for (var j = 0; j < balls.length; j++) {
      var ball = balls[j];
      if (collision_detector(monster, ball)) {
        balls.splice(j, 1);
        monsters.splice(i, 1);
        score += 2;
      }
    }
  }
}

//Usado para mostrar el numero de vidas restantes y el score del juego
function dibujarInfo() {
  ctx.font = "bold 15px Gill Sans MT";
  ctx.fillStyle = "blue";
  ctx.fillText("Lives: " + vidas_jugador, 635, 22);
  ctx.fillText("Score: " + score, 13, 22)
}

//Funcion Principal, sera usada para correr el juego
function dibujar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarBorder();
  dibujarInfo();
  dibujarplayer();
  dibujarBalls();
  dibujarBlocks();
  dibujar_monsters();
  moveBalls();
  player_block_collision();
  ball_monster_collision();
  moverFunc();

  if (space_pressed && balls.length < 10 && performance.now() - since_last_fire > 500) {
    dibujarNewBall(player.get("X") + 15, player.get("Y") - 30);
  }
  if (right_pressed && player.get("X") + player_width < canvas.width) {
    player.set("X", player.get("X") + 1);
  }
  if (left_pressed && player.get("X") > 0) {
    player.set("X", player.get("X") - 1);
  }

  if (blocks.length < 3) {
    dibujarNewBlock();
  }
  if (monsters.length < 1) {
    create_monster();
  }
  if (!player_block_collision_bool && vidas_jugador < 0) {
     alert("You lost");
     document.location.reload()
  }

  requestAnimationFrame(dibujar);
}

//Ejecuta el Juego.
dibujar();
