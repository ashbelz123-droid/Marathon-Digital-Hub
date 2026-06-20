const canvas = document.getElementById("network");

if (canvas) {

const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

const PARTICLE_COUNT = 80;

for (let i = 0; i < PARTICLE_COUNT; i++) {

particles.push({
x: Math.random() * canvas.width,
y: Math.random() * canvas.height,
vx: (Math.random() - 0.5) * 1.2,
vy: (Math.random() - 0.5) * 1.2,
size: Math.random() * 3 + 1
});

}

function animate() {

ctx.clearRect(0, 0, canvas.width, canvas.height);

for (let i = 0; i < particles.length; i++) {

let p = particles[i];

p.x += p.vx;
p.y += p.vy;

if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

ctx.beginPath();
ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
ctx.fillStyle = "#00d4ff";
ctx.fill();

for (let j = i + 1; j < particles.length; j++) {

let q = particles[j];

let dx = p.x - q.x;
let dy = p.y - q.y;

let distance = Math.sqrt(dx * dx + dy * dy);

if (distance < 120) {

ctx.beginPath();
ctx.moveTo(p.x, p.y);
ctx.lineTo(q.x, q.y);

ctx.strokeStyle =
`rgba(0,212,255,${1 - distance / 120})`;

ctx.lineWidth = 1;

ctx.stroke();

}

}

}

requestAnimationFrame(animate);

}

animate();

window.addEventListener("resize", () => {

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

});

  }
