/* MDH visible network background */
const canvas=document.getElementById('network');
if(canvas){
 const ctx=canvas.getContext('2d',{alpha:true});
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let particles=[],w=0,h=0,raf=0;
 function resize(){const dpr=Math.min(devicePixelRatio||1,1.5);w=innerWidth;h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);const mobile=w<600,count=reduce?0:(mobile?24:Math.min(58,Math.floor(w*h/18000)));particles=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.24,vy:(Math.random()-.5)*.24,r:Math.random()*1.5+.7}));}
 function draw(){ctx.clearRect(0,0,w,h);for(const p of particles){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(44,255,156,.78)';ctx.shadowBlur=9;ctx.shadowColor='rgba(25,232,137,.5)';ctx.fill();ctx.shadowBlur=0;}const max=w<600?155:205;for(let i=0;i<particles.length;i++)for(let j=i+1;j<particles.length;j++){const a=particles[i],b=particles[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d<max){const alpha=(1-d/max)*.30;ctx.strokeStyle=`rgba(35,255,151,${alpha})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}
 function animate(){draw();if(!reduce)raf=requestAnimationFrame(animate)}
 resize();addEventListener('resize',resize,{passive:true});if(!reduce)animate();addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
}
