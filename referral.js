/* ==========================================
SUPABASE
========================================== */

const db = window.supabaseClient;

let currentUser = null;
let profile = null;

/* ==========================================
START
========================================== */

document.addEventListener("DOMContentLoaded", async () => {

const { data:{ user } } = await db.auth.getUser();

if(!user){

window.location.href="login.html";

return;

}

currentUser = user;

await loadProfile();

await loadReferralStats();

await loadReferralLink();

/* Remaining functions continue
in Part 2 */

});

/* ==========================================
PROFILE
========================================== */

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

profile = data;

}

/* ==========================================
REFERRAL LINK
========================================== */

async function loadReferralLink(){

const input = document.getElementById("referralLink");

const code = profile.referral_code;

const link =

window.location.origin +

"/register.html?ref=" +

code;

input.value = link;

}

/* ==========================================
REFERRAL STATISTICS
========================================== */

async function loadReferralStats(){

/* Total Referrals */

const { data:refs } = await db

.from("profiles")

.select("*")

.eq("referred_by",profile.referral_code);

document.getElementById("totalReferrals").innerHTML=

refs.length;

/* Active Referrals */

const active = refs.filter(item=>item.status==="active");

document.getElementById("activeReferrals").innerHTML=

active.length;

/* Referral Income */

const { data:income } = await db

.from("referral_rewards")

.select("amount")

.eq("user_id",currentUser.id);

let totalIncome=0;

if(income){

income.forEach(item=>{

totalIncome+=Number(item.amount);

});

}

document.getElementById("referralIncome").innerHTML=

"UGX "+totalIncome.toLocaleString();

/* Raffle Chances */

const { data:raffle } = await db

.from("raffle_entries")

.select("chances")

.eq("user_id",currentUser.id)

.single();

document.getElementById("raffleChances").innerHTML=

raffle ? raffle.chances : 0;

}/* ==========================================
COPY REFERRAL LINK
========================================== */

document.getElementById("copyReferral")

.addEventListener("click",()=>{

const input=document.getElementById("referralLink");

input.select();

input.setSelectionRange(0,99999);

navigator.clipboard.writeText(input.value);

alert("Referral link copied successfully.");

});

/* ==========================================
SHARE REFERRAL LINK
========================================== */

document.getElementById("shareReferral")

.addEventListener("click",async()=>{

const link=document.getElementById("referralLink").value;

if(navigator.share){

await navigator.share({

title:"Marathon Digital Hub",

text:"Join Marathon Digital Hub using my referral link.",

url:link

});

}else{

navigator.clipboard.writeText(link);

alert("Referral link copied.");

}

});

/* ==========================================
LOAD MY REFERRALS
========================================== */

async function loadReferralList(){

const { data,error } = await db

.from("profiles")

.select("*")

.eq("referred_by",profile.referral_code)

.order("created_at",{ascending:false});

if(error){

console.log(error);

return;

}

const container=document.getElementById("referralList");

container.innerHTML="";

if(data.length===0){

container.innerHTML=`

<div class="loadingCard">

You have not referred anyone yet.

</div>

`;

return;

}

document.getElementById("referralCount").innerHTML=

data.length;

data.forEach(user=>{

container.innerHTML+=`

<div class="referralItem">

<h4>${user.fullname}</h4>

<p>

Status:

<b>${user.status || "Pending"}</b>

</p>

<p>

Joined:

${new Date(user.created_at).toLocaleDateString()}

</p>

</div>

`;

});

}

/* ==========================================
LOAD LEADERBOARD
========================================== */

async function loadLeaderboard(){

const { data,error } = await db

.from("profiles")

.select("fullname,total_referrals")

.order("total_referrals",{ascending:false})

.limit(10);

if(error){

console.log(error);

return;

}

const board=document.getElementById("leaderboard");

board.innerHTML="";

data.forEach((user,index)=>{

board.innerHTML+=`

<div class="leaderItem">

<div class="leaderRank">

#${index+1}

</div>

<div class="leaderName">

${user.fullname}

</div>

<div class="leaderCount">

${user.total_referrals || 0}

</div>

</div>

`;

});

}

/* ==========================================
LOAD EVERYTHING
========================================== */

document.addEventListener("DOMContentLoaded",async()=>{

if(!currentUser) return;

await loadReferralList();

await loadLeaderboard();

});

/* ==========================================
END OF referral.js
========================================== */
