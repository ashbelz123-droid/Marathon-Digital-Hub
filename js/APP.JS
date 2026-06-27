/* =========================
   MARATHON DIGITAL HUB
   GLOBAL JAVASCRIPT
========================= */

/* COPY REFERRAL LINK */

function copyReferral(link){

navigator.clipboard.writeText(link);

alert("Referral link copied successfully!");

}

/* LOGOUT */

function logout(){

if(confirm("Are you sure you want to logout?")){

window.location.href = "login.html";

}

}

/* LOGIN */

function loginUser(){

let email =
document.getElementById("email").value;

let password =
document.getElementById("password").value;

if(email === "" || password === ""){

alert("Please fill all fields");

return;

}

alert("Login successful");

window.location.href =
"dashboard.html";

}

/* REGISTER */

function registerUser(){

let username =
document.getElementById("username").value;

let email =
document.getElementById("email").value;

let password =
document.getElementById("password").value;

if(
username === "" ||
email === "" ||
password === ""
){

alert("Please fill all fields");

return;

}

alert("Registration successful");

window.location.href =
"login.html";

}
/* DEPOSIT FUNCTION */

function submitDeposit(){

let amount =
document.getElementById("amount").value;

if(amount === ""){

alert("Enter deposit amount");

return;

}

alert(
"Deposit request submitted successfully."
);

}

/* WITHDRAW FUNCTION */

function submitWithdraw(){

let phone =
document.getElementById("phone").value;

let amount =
document.getElementById("amount").value;

if(phone === "" || amount === ""){

alert("Please complete all fields");

return;

}

alert(
"Withdrawal request submitted successfully."
);

}

/* MACHINE PURCHASE */

function buyMachine(name, price){

let confirmBuy =
confirm(
"Buy " + name + " for UGX " + price + " ?"
);

if(confirmBuy){

alert(
name + " activated successfully!"
);

}

}

/* BALANCE DISPLAY */

function updateBalance(amount){

let balance =
document.getElementById("balance");

if(balance){

balance.innerText =
"UGX " + amount;

}

}

/* SIMPLE NOTIFICATION */

function showNotification(message){

alert(message);

}
/* AUTO REFRESH */

function autoRefresh(){

console.log("Refreshing data...");

}

setInterval(autoRefresh,30000);

/* RECENT ACTIVITY */

function addActivity(activity){

console.log(
"Activity Added: " + activity
);

}

/* WALLET STATS */

function walletStats(){

let deposits = 1250000;
let withdrawals = 420000;
let earnings = 691850;

console.log(
"Deposits:", deposits
);

console.log(
"Withdrawals:", withdrawals
);

console.log(
"Earnings:", earnings
);

}

/* LOADING SPINNER */

function showLoader(){

let loader =
document.getElementById("loader");

if(loader){

loader.style.display = "block";

}

}

function hideLoader(){

let loader =
document.getElementById("loader");

if(loader){

loader.style.display = "none";

}

}

/* FORMAT MONEY */

function formatMoney(amount){

return "UGX " +
Number(amount).toLocaleString();

}

/* CURRENT DATE */

function getCurrentDate(){

let today = new Date();

return today.toLocaleDateString();

}

/* PAGE READY */

document.addEventListener(
"DOMContentLoaded",
function(){

console.log(
"Marathon Digital Hub Loaded"
);

}
);
