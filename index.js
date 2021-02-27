const canvas = document.querySelector('canvas');

const ctx = canvas.getContext('2d');

const soundtrack = document.getElementById("soundtrack");
const laserSound = document.getElementById("laserSound");
laserSound.volume = 0.3;

var timesReplayed = 0;


canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector('#scoreEl');
const startingButton = document.querySelector('#startingButton');
const modalEl = document.querySelector("#modalEl");
const endScore = document.querySelector("#endScore");

const playerFriction = 0.975;
class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speedX = 0.0;
        this.speedY = 0.0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "cyan"
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    update() {
        this.speedX *= playerFriction;
        this.speedY *= playerFriction;

        if(this.x + this.speedX < canvas.width && this.x + this.speedX > 0) {
            this.x += this.speedX;
        }

        if(this.y + this.speedY < canvas.height && this.y + this.speedY > 0) {
            this.y += this.speedY;
        }
        this.draw()
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw(); 
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = colorArray[Math.floor(Math.random() * colorArray.length)];
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 30;
        ctx.fill();     
        ctx.shadowBlur = 0;
    }

    update() {
        this.draw(); 
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

const friction = 0.99;

class Particle {
    constructor(x, y, radius, velocity, enemy) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.velocity = velocity;
        this.alpha = 1;
        this.enemy = enemy;
        this.color = enemy.color;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.globalAlpha = this.alpha;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 50;
        ctx.fill();     
        ctx.shadowBlur = 0;     
        ctx.restore();
    }

    update() {
        this.draw(); 
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.015;
    }
}

var x = canvas.width / 2;
var y = canvas.height / 2;

let player = new Player(x, y, 10, 'white')

let projectiles = [];
let enemies = [];
let particles = [];

const colorArray = [
    '#ffd319',
    '#ff901f',
    '#ff2975',
    '#f222ff',
    '#8c1eff'
]

function init() {
    player = new Player(x, y, 10, 'white')

    projectiles = [];
    enemies = [];
    particles = [];
    score = 0; 
}

function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (35 - 10) + 10;
        let x; 
        let y;

        if(Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0: canvas.width;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0: canvas.height; 
        }

        const angle = Math.atan2(player.y - y, player.x - x);
        const velocity = {
            x: Math.cos(angle) * 2,
            y: Math.sin(angle) * 2
        }

        enemies.push(new Enemy(x, y, radius, velocity))
        console.log(enemies)
    }, Math.random() * (1000 - 500) + 500)  
}

let animationId;
let score = 0;

function animate() {
    animationId = requestAnimationFrame(animate);

    ctx.fillStyle = 'rgba(0,10,44, 0.3)'
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    player.update();

    
    for(var i = 0; i < projectiles.length; i++) {
        projectiles[i].update();

        if(projectiles[i].x > canvas.width - 20 ||
             projectiles[i].x < 20 ||
              projectiles[i].y > canvas.height - 20 ||
              projectiles[i].y < 20) {
            projectiles.splice(i, 1);
        }
    }

    enemies.forEach((enemy, index) => {

        if(enemy.x > 2000 || enemy.x < -300 || enemy.y > 1200 || enemy.y < -300) {
            enemies.splice(index, 1)
        }

        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if(dist - player.radius - enemy.radius < 1) {
            cancelAnimationFrame(animationId)
            endScore.innerHTML = score;
            modalEl.style.display = 'flex';
            
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if(dist - enemy.radius - projectile.radius < 1) {
              
                if(enemy.radius - 10 > 10) {
                    score += 100;
                    scoreEl.innerHTML = score;

                    gsap.to(enemy,{
                      radius: enemy.radius - 10  
                    } )
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0)
                } else {

                    score += 250;
                    scoreEl.innerHTML = score;

                    gsap.to(enemy,{
                    radius: 0
                    })  

                    projectiles.splice(projectileIndex, 1);

                   
                        setTimeout(function() {
                            enemies.splice(index, 1);
                        }, 120)  
                    
                                
                }     
                for(var i = 0; i < Math.floor(enemy.radius / 2); i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2,
                        {x: (Math.random() - 0.5) * (Math.random() * 10 ) , y: (Math.random() - 0.5) * (Math.random() * 10) }, enemy))
                }
                              
            }
        })   
    })

    particles.forEach((particle, index) => {
    if(particle.alpha <= 0.15) {
        particles.splice(index, 15);
    } else {
        particle.update()
    } 
})}


addEventListener('click', (event) => {
    const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
    const velocity = {
        x: Math.cos(angle) * 24,
        y: Math.sin(angle) * 24
    }
    projectiles.push(new Projectile(player.x, player.y, 3.5, 'white', velocity ));
    laserSound.play();
})

window.onkeydown = function(event) {
    event.preventDefault() 
    if(event.keyCode == 83) { 
        if(player.speedY < 4 && player.y < canvas.height) {
            player.speedY += 4;
        }
    } else if(event.keyCode == 87 && player.y > 0) {
        if(player.speedY > -4) {
            player.speedY -= 4;
        }
    } else if(event.keyCode == 68 && player.x < canvas.width) { 
        if(player.speedX < 4) {
            player.speedX += 4 
        }
    } else if(event.keyCode == 65 && player.x > 0) { 
        if(player.speedX > -4) {
            player.speedX -= 4
        }
    } 
  }

window.onkeyup = function(event) {
    event.preventDefault() 
    if(event.keyCode == 83 || event.keyCode == 87) {
        player.speedY *= playerFriction;
    } else if(event.keyCode == 68 || event.keyCode == 65) {
        player.speedX *= playerFriction;
    }
  }

startingButton.addEventListener('click', () => {
    timesReplayed++;
    init();
    
    if(timesReplayed <= 1) {
        spawnEnemies();
    }   
    
    if(soundtrack.paused) {
        soundtrack.currentTime = 0;
        soundtrack.play();
    }

    modalEl.style.display = 'none';    
    animate();
}) 

  

