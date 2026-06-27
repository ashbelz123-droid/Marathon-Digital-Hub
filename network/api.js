/* =========================
   MARATHON DIGITAL HUB API
========================= */

const API_URL =
"https://your-api-domain.com/api";

/* LOGIN */

async function apiLogin(email,password){

try{

const response = await fetch(
API_URL + "/login",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,
password
})
}
);

const data =
await response.json();

return data;

}catch(error){

console.error(error);

return {
success:false,
message:"Network Error"
};

}

}

/* REGISTER */

async function apiRegister(
username,
email,
password
){

try{

const response = await fetch(
API_URL + "/register",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
username,
email,
password
})
}
);

const data =
await response.json();

return data;

}catch(error){

console.error(error);

return {
success:false
};

}

}

/* GET USER PROFILE */

async function getProfile(userId){

try{

const response = await fetch(
API_URL + "/user/" + userId
);

return await response.json();

}catch(error){

console.error(error);

}

}
/* DEPOSIT API */

async function createDeposit(
userId,
amount,
network
){

try{

const response = await fetch(
API_URL + "/deposit",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
userId,
amount,
network
})
}
);

return await response.json();

}catch(error){

console.error(error);

}

}

/* WITHDRAW API */

async function createWithdraw(
userId,
amount,
phone
){

try{

const response = await fetch(
API_URL + "/withdraw",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
userId,
amount,
phone
})
}
);

return await response.json();

}catch(error){

console.error(error);

}

}

/* WALLET API */

async function getWallet(userId){

try{

const response = await fetch(
API_URL + "/wallet/" + userId
);

return await response.json();

}catch(error){

console.error(error);

}

}

/* MACHINES API */

async function getMachines(){

try{

const response = await fetch(
API_URL + "/machines"
);

return await response.json();

}catch(error){

console.error(error);

}

}

/* TRANSACTIONS API */

async function getTransactions(userId){

try{

const response = await fetch(
API_URL + "/transactions/" + userId
);

return await response.json();

}catch(error){

console.error(error);

}

}

  /* BUY MACHINE API */

async function buyMachine(
userId,
machineId
){

try{

const response = await fetch(
API_URL + "/buy-machine",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
userId,
machineId
})
}
);

return await response.json();

}catch(error){

console.error(error);

}

}

/* REFERRAL API */

async function getReferralData(
userId
){

try{

const response = await fetch(
API_URL + "/referrals/" + userId
);

return await response.json();

}catch(error){

console.error(error);

}

}

/* NOTIFICATIONS API */

async function getNotifications(
userId
){

try{

const response = await fetch(
API_URL + "/notifications/" + userId
);

return await response.json();

}catch(error){

console.error(error);

}

}

/* ADMIN DASHBOARD */

async function getAdminStats(){

try{

const response = await fetch(
API_URL + "/admin/stats"
);

return await response.json();

}catch(error){

console.error(error);

}

}

/* APPROVE DEPOSIT */

async function approveDeposit(
depositId
){

try{

const response = await fetch(
API_URL + "/admin/approve-deposit",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
depositId
})
}
);

return await response.json();

}catch(error){

console.error(error);

}

}

/* APPROVE WITHDRAWAL */

async function approveWithdrawal(
withdrawalId
){

try{

const response = await fetch(
API_URL + "/admin/approve-withdrawal",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
withdrawalId
})
}
);

return await response.json();

}catch(error){

console.error(error);

}

}

/* HEALTH CHECK */

async function pingServer(){

try{

const response = await fetch(
API_URL + "/health"
);

return await response.json();

}catch(error){

return {
status:"offline"
};

}

}

console.log(
"API Layer Loaded Successfully"
);
