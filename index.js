let canv = document.getElementById("canv");
let ctx = canv.getContext("2d");
const ws = new WebSocket("ws://localhost:3000");
let game = {
  game_start: false,
  client_room: null,
  client_id: null,
  leader: false,
  open: false,
  scores: {
    pl1: 0,
    pl2: 0,
  },
};

canv.width = 667;
canv.height = 375;

const net = {
  x: canv.width / 2 - 2.5,
  y: 25,

  width: 5,
  height: 30,

  color: "white",
};
let player1 = {
  x: 0,
  y: canv.height / 2 - 40,

  width: 10,
  height: 80,

  color: "white",
};
let player2 = {
  x: 657,
  y: canv.height / 2 - 40,

  width: 10,
  height: 80,

  color: "white",
};
let ball = {
  x: canv.width / 2,
  y: canv.height / 2 + 2,

  radius: 15,

  speed: 5,
  velocityX: 5,
  velocityY: 5,
  side: "none",

  color: "white",
};

let moving = {
  side: null,
  start: { X: null, y: null },
  move: { X: null, y: null },
};

function ballstart() {
  ball.x = canv.width / 2;
  ball.y = canv.height / 2 + 2;
  ball.speed = 5;
}
function collision(b, p) {
  p.top = p.y;
  p.bottom = p.y + p.height;
  p.left = p.x;
  p.right = p.x + p.width;

  b.top = b.y - b.radius;
  b.bottom = b.y + b.radius;
  b.left = b.x - b.radius;
  b.right = b.x + b.radius;

  return (
    p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top
  );
}
ballstart();
ws.onopen = () => {
  game.open=true
};
ws.onclose = () => {
  game.open=false
};
ws.onmessage = (res) => {
  let parse = JSON.parse(res.data);
  if (parse.game_status == "start") {
    game.game_start = true;
    game.client_room = parse.room;
    game.client_id = parse.client_id;
    if (parse.data.leader==parse.client_id){
      game.leader = true;
    }
    document.querySelector(".wait").style.display = "none";
    canv.style.display = "block";
    ballstart();
  } else if (parse.game_status == "idet") {
    if (parse.type === "pl-move") {
      player2.y = parse.data.y;
    } else if (parse.type === "ball-move") {
      ball.y = parse.data.ball.y;
      if (parse.data.ball.x>canv.width/2) {
        let x = canv.width-parse.data.ball.x
        ball.x = x;
      } else if (parse.data.ball.x<canv.width/2) {
        let x = canv.width-parse.data.ball.x
        ball.x = x;
      }
      
      game.scores.pl1=parse.data.scores.pl1
      game.scores.pl2=parse.data.scores.pl2
    }
  } else if (parse.game_status == "finish") {
    console.log("finished");
    if (parse.winner=="another") {
      console.log("won");
      document.querySelector(".wait").style.display = "none";
        canv.style.display = "none";
        document.querySelector(".finish").style.display="flex";
        document.querySelector(".finish").innerHTML=`ты победил!<a href="http://127.0.0.1:5500/">Back</a>`
    } else {
      console.log("lost");
      document.querySelector(".wait").style.display = "none";
      canv.style.display = "none";
      document.querySelector(".finish").style.display="flex";
    }
  }
};
canv.addEventListener("touchstart", (e) => {
  moving.start.x =
    375 * ((e.touches[0].clientX - e.target.offsetLeft) / canv.offsetWidth);
  moving.start.y =
    667 * ((e.touches[0].clientY - e.target.offsetTop) / canv.offsetHeight);
});
canv.addEventListener("touchmove", (e) => {
  moving.move.x =
    375 * ((e.touches[0].clientX - e.target.offsetLeft) / canv.offsetWidth);
  moving.move.y =
    667 * ((e.touches[0].clientY - e.target.offsetTop) / canv.offsetHeight);

  if (moving.start.x === null) {
    return;
  }

  if (moving.start.y === null) {
    return;
  }

  let diffY = moving.start.y - moving.move.y;

  if (diffY > 0) {
    moving.side = "top";
  } else {
    moving.side = "down";
  }
});

function drawNet() {
  for (let i = 0; i < canv.height; i += 50) {
    ctx.fillStyle = net.color;
    ctx.fillRect(net.x, net.y + i, net.width, net.height);
  }
}
function drawText(text,x,y){
  ctx.fillStyle = "#FFF";
  ctx.font = "75px joystixmonospace";
  ctx.fillText(text, x, y);
}
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = ball.color;
  ctx.fill();
}

function start() {
  if (game.game_start) {
    ctx.clearRect(0, 0, 667, 375);

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height);
    drawNet();
    if (game.leader) {
      drawText(game.scores.pl1,canv.width/4,canv.height/4);
      drawText(game.scores.pl2,2.7*canv.width/4,canv.height/4);
    } else {
      drawText(game.scores.pl2,canv.width/4,canv.height/4);
    drawText(game.scores.pl1,2.7*canv.width/4,canv.height/4);
    }

    ctx.fillStyle = "white";
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

    drawBall();
    if (game.leader) {
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
      if (ball.x - ball.radius < 0) {
        game.scores.pl2++;
        ballstart();
      } else if (ball.x + ball.radius > canv.width) {
        game.scores.pl1++;
        ballstart();
      }
      if(ball.y - ball.radius < 0 || ball.y + ball.radius > canv.height){
        ball.velocityY = -ball.velocityY;
    }
    let player = (ball.x + ball.radius < canv.width/2) ? player1 : player2;
      if (collision(ball, player)) {
        let collidePoint = ball.y - (player.y + player.height / 2);
        collidePoint = collidePoint / (player.height / 2);
        let angleRad = (Math.PI/4) * collidePoint;
        let direction = ball.x + ball.radius < canv.width / 2 ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        ball.speed += 0.1;
      }
      let ballstr = JSON.stringify({
        type: "ball-move",
        room: game.client_room,
        client_id: game.client_id,
        game_status: "idet",
        data: {ball: ball, scores:game.scores},
      })
      if (game.open) ws.send(ballstr)
      if (game.scores.pl1>=5) {
          if (game.open){
            ws.send(JSON.stringify({type:"finish",winner:game.client_id,room: game.client_room,game_status:"finish"}));
            game.game_start = false
          } 
        document.querySelector(".wait").style.display = "none";
        canv.style.display = "none";
        document.querySelector(".finish").style.display="flex";
        document.querySelector(".finish").innerHTML=`ты победил!<a href="http://127.0.0.1:5500/">Back</a>`
      } else if (game.scores.pl2>=5) {
          if (game.open){
            ws.send(JSON.stringify({type:"finish",winner:"another",room: game.client_room,game_status:"finish"}));
            game.game_start = false
          } 
        document.querySelector(".wait").style.display = "none";
        canv.style.display = "none";
        document.querySelector(".finish").style.display="flex";
      }
    }
    if (moving.side === "top") {
      player1.y -= 4;
      let obj = JSON.stringify({
        type: "pl-move",
        room: game.client_room,
        client_id: game.client_id,
        game_status: "idet",
        data: {
          y: player1.y,
        },
      });
      if (game.open) ws.send(obj);
    } else if (moving.side === "down") {
      player1.y += 4;
      let obj = JSON.stringify({
        type: "pl-move",
        room: game.client_room,
        client_id: game.client_id,
        game_status: "idet",
        data: {
          y: player1.y,
        },
      });
      if (game.open) ws.send(obj);
    }
    if (player1.y < 0) player1.y = 0;
    else if (player1.y > 295) player1.y = 295;
  }
  requestAnimationFrame(start);
}

start();
