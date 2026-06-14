const canvas = document.getElementById("network");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let points = [];

for(let i=0;i<70;i++){
points.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
vx:(Math.random()-0.5)*1,
vy:(Math.random()-0.5)*1
});
}

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height);

for(let p of points){

p.x += p.vx;
p.y += p.vy;

if(p.x<0 || p.x>canvas.width) p.vx *= -1;
if(p.y<0 || p.y>canvas.height) p.vy *= -1;

ctx.beginPath();
ctx.arc(p.x,p.y,2,0,Math.PI*2);
ctx.fillStyle="#00d4ff";
ctx.fill();

for(let p2 of points){

let dx = p.x - p2.x;
let dy = p.y - p2.y;
let dist = Math.sqrt(dx*dx + dy*dy);

if(dist < 120){

ctx.beginPath();
ctx.moveTo(p.x,p.y);
ctx.lineTo(p2.x,p2.y);
ctx.strokeStyle=`rgba(0,200,255,${1-dist/120})`;
ctx.stroke();

}

}

}

requestAnimationFrame(draw);
}

draw();

window.addEventListener("resize",()=>{
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
});
