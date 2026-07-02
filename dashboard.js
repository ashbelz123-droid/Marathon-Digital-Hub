/* ===========================================
SUPABASE
=========================================== */

const db = window.supabaseClient;

let currentUser = null;

/* ===========================================
START DASHBOARD
=========================================== */

document.addEventListener("DOMContentLoaded", async () => {

const { data:{ user } } = await db.auth.getUser();

if(!user){

window.location.href="login.html";

return;

}

currentUser = user;

/* Load Dashboard */

await loadProfile();

await loadWallet();

await loadMachines();

await loadDeposits();

await loadWithdrawals();

/* Remaining functions continue
in Part 2 */

});

/* ===========================================
PROFILE
=========================================== */

async function loadProfile(){

const { data,error } = await db

.from("profiles")

.select("*")

.eq("id",currentUser.id)

.single();

if(error){

console.log(error);

return;

}

document.getElementById("userName").innerHTML=

data.fullname;

}

/* ===========================================
WALLET
=========================================== */

async function loadWallet(){

const { data,error } = await db

.from("profiles")

.select("wallet_balance")

.eq("id",currentUser.id)

.single();

if(error)return;

document.getElementById("walletBalance").innerHTML=

"UGX "+Number(data.wallet_balance).toLocaleString();

const walletCard=document.getElementById("walletBalanceCard");

if(walletCard){

walletCard.innerHTML=

"UGX "+Number(data.wallet_balance).toLocaleString();

}

}

/* ===========================================
ACTIVE MACHINES
=========================================== */

async function loadMachines(){

const { data,error } = await db

.from("user_machines")

.select("*")

.eq("user_id",currentUser.id)

.eq("status","active");

if(error)return;

document.getElementById("activeMachines").innerHTML=

data.length;

}

/* ===========================================
TOTAL DEPOSITS
=========================================== */

async function loadDeposits(){

const { data,error } = await db

.from("deposits")

.select("amount")

.eq("user_id",currentUser.id)

.eq("status","approved");

if(error)return;

let total=0;

data.forEach(item=>{

total+=Number(item.amount);

});

document.getElementById("totalDeposits").innerHTML=

"UGX "+total.toLocaleString();

}

/* ===========================================
TOTAL WITHDRAWALS
=========================================== */

async function loadWithdrawals(){

const { data,error } = await db

.from("withdrawals")

.select("amount")

.eq("user_id",currentUser.id)

.eq("status","approved");

if(error)return;

let total=0;

data.forEach(item=>{

total+=Number(item.amount);

});

document.getElementById("totalWithdrawals").innerHTML=

"UGX "+total.toLocaleString();

                          }/* ===========================================
ANNOUNCEMENTS
=========================================== */

async function loadAnnouncements(){

const { data,error } = await db

.from("notifications")

.select("*")

.eq("is_active",true)

.order("created_at",{ascending:false});

if(error){

console.log(error);

return;

}

const announcement=document.getElementById("announcementList");

announcement.innerHTML="";

if(data.length===0){

announcement.innerHTML=

`<div class="announcementCard">

No announcements available.

</div>`;

return;

}

data.slice(0,4).forEach(item=>{

announcement.innerHTML+=`

<div class="announcementCard">

<h4>${item.title}</h4>

<p>${item.message}</p>

</div>

`;

});

}

/* ===========================================
NOTIFICATIONS
=========================================== */

async function loadNotifications(){

const { data,error } = await db

.from("notifications")

.select("*")

.eq("is_active",true)

.order("created_at",{ascending:false});

if(error){

console.log(error);

return;

}

document.getElementById("notifyCount").innerHTML=

data.length;

const badge=document.getElementById("notificationBadge");

if(badge){

badge.innerHTML=data.length;

}

const list=document.getElementById("notificationList");

list.innerHTML="";

data.slice(0,5).forEach(item=>{

list.innerHTML+=`

<div class="notificationCard">

<strong>${item.title}</strong>

<br>

${item.message}

</div>

`;

});

}

/* ===========================================
RECENT TRANSACTIONS
=========================================== */

async function loadTransactions(){

const { data,error } = await db

.from("wallet_transactions")

.select("*")

.eq("user_id",currentUser.id)

.order("created_at",{ascending:false})

.limit(5);

if(error){

console.log(error);

return;

}

const container=document.getElementById("transactionContainer");

container.innerHTML="";

if(data.length===0){

container.innerHTML=

`<div class="transactionCard">

No transactions found.

</div>`;

return;

}

data.forEach(item=>{

container.innerHTML+=`

<div class="transactionCard">

<strong>${item.type}</strong>

<br>

UGX ${Number(item.amount).toLocaleString()}

</div>

`;

});

}

/* ===========================================
LOAD REMAINING DATA
=========================================== */

document.addEventListener("DOMContentLoaded",async()=>{

if(!currentUser)return;

await loadAnnouncements();

await loadNotifications();

await loadTransactions();

/* Remaining code continues in Part 3 */

});/* ===========================================
LIVE CRYPTO TICKER
=========================================== */

async function loadCryptoTicker(){

try{

const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana&vs_currencies=usd&include_24hr_change=true");

const data = await res.json();

document.getElementById("tickerText").innerHTML =

`₿ BTC $${data.bitcoin.usd.toLocaleString()} (${data.bitcoin.usd_24h_change.toFixed(2)}%)
&nbsp;&nbsp;&nbsp; Ξ ETH $${data.ethereum.usd.toLocaleString()} (${data.ethereum.usd_24h_change.toFixed(2)}%)
&nbsp;&nbsp;&nbsp; ₮ USDT $${data.tether.usd.toFixed(2)}
&nbsp;&nbsp;&nbsp; ◎ SOL $${data.solana.usd.toLocaleString()} (${data.solana.usd_24h_change.toFixed(2)}%)`;

}catch(err){

document.getElementById("tickerText").innerHTML=

"Unable to load crypto market.";

}

}

/* ===========================================
WAVE DOT BACKGROUND
=========================================== */

const canvas=document.getElementById("waveCanvas");

const ctx=canvas.getContext("2d");

let dots=[];

function resizeCanvas(){

canvas.width=window.innerWidth;

canvas.height=320;

}

window.addEventListener("resize",resizeCanvas);

resizeCanvas();

for(let i=0;i<120;i++){

dots.push({

x:Math.random()*canvas.width,

y:Math.random()*canvas.height,

r:Math.random()*3+1,

dx:(Math.random()-0.5)*0.4,

dy:(Math.random()-0.5)*0.4,

color:[
"#00d4ff",
"#00ff88",
"#7b61ff",
"#ff5dff",
"#4fc3ff"
][Math.floor(Math.random()*5)]

});

}

function animateDots(){

ctx.clearRect(0,0,canvas.width,canvas.height);

dots.forEach(dot=>{

dot.x+=dot.dx;

dot.y+=dot.dy;

if(dot.x<0||dot.x>canvas.width) dot.dx*=-1;

if(dot.y<0||dot.y>canvas.height) dot.dy*=-1;

ctx.beginPath();

ctx.arc(dot.x,dot.y,dot.r,0,Math.PI*2);

ctx.fillStyle=dot.color;

ctx.fill();

});

requestAnimationFrame(animateDots);

}

animateDots();

/* ===========================================
AUTO REFRESH
=========================================== */

loadCryptoTicker();

setInterval(loadCryptoTicker,60000);

/* dashboard.js END */
