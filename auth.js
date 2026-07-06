/* =========================================
   Marathon Digital Hub
   AUTH + SECURITY
   Part 1
========================================= */

const db = window.supabaseClient;

/* Public pages */

const PUBLIC_PAGES = [

"login.html",

"register.html",

"forgot-password.html",

"index.html"

];

/* Current page */

const currentPage =
window.location.pathname.split("/").pop() || "index.html";

/* Authentication */

document.addEventListener("DOMContentLoaded", async () => {

if(PUBLIC_PAGES.includes(currentPage)) return;

if(!db){

console.error("Supabase client not found.");

return;

}

const { data:{ user } } = await db.auth.getUser();

if(!user){

window.location.replace("login.html");

return;

}

window.currentUser = user;

});

/* Session Monitor */

db?.auth.onAuthStateChange((event,session)=>{

if(PUBLIC_PAGES.includes(currentPage)) return;

if(!session){

window.location.replace("login.html");

return;

}

window.currentUser = session.user;

});

/* =========================================
   SECURITY PROTECTION
========================================= */

/* Disable Right Click */

document.addEventListener("contextmenu",(e)=>{

e.preventDefault();

});

/* Disable Text Selection */

document.addEventListener("selectstart",(e)=>{

const tag=e.target.tagName.toLowerCase();

if(tag!="input" && tag!="textarea"){

e.preventDefault();

}

});

/* Disable Drag */

document.addEventListener("dragstart",(e)=>{

e.preventDefault();

});

/* Disable Image Drag */

window.addEventListener("load",()=>{

document.querySelectorAll("img").forEach(img=>{

img.setAttribute("draggable","false");

});

});

/* Remove Mobile Highlight */

const style=document.createElement("style");

style.innerHTML=`

*{

-webkit-tap-highlight-color:transparent;

-webkit-touch-callout:none;

}

body{

-webkit-user-select:none;

user-select:none;

}

input,
textarea{

-webkit-user-select:text;

user-select:text;

-webkit-touch-callout:default;

}

`;

document.head.appendChild(style);

/* =========================================
   BLOCK COMMON SHORTCUTS
========================================= */

document.addEventListener("keydown",(e)=>{

const tag=(e.target.tagName || "").toLowerCase();

/* Allow typing inside inputs */

if(tag==="input" || tag==="textarea"){

return;

}

/* F12 */

if(e.key==="F12"){

e.preventDefault();

return false;

}

/* Ctrl + Shift + I */

if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="i"){

e.preventDefault();

return false;

}

/* Ctrl + Shift + J */

if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="j"){

e.preventDefault();

return false;

}

/* Ctrl + Shift + C */

if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="c"){

e.preventDefault();

return false;

}

/* Ctrl + U */

if(e.ctrlKey && e.key.toLowerCase()==="u"){

e.preventDefault();

return false;

}

/* Ctrl + S */

if(e.ctrlKey && e.key.toLowerCase()==="s"){

e.preventDefault();

return false;

}

/* Ctrl + P */

if(e.ctrlKey && e.key.toLowerCase()==="p"){

e.preventDefault();

return false;

}

});

/* =========================================
   DISABLE COPY OUTSIDE INPUTS
========================================= */

document.addEventListener("copy",(e)=>{

const tag=(e.target.tagName || "").toLowerCase();

if(tag!=="input" && tag!=="textarea"){

e.preventDefault();

}

});

/* =========================================
   FINAL SECURITY
========================================= */

/* Disable image save */

window.addEventListener("load",()=>{

document.querySelectorAll("img").forEach(img=>{

img.setAttribute("draggable","false");

img.addEventListener("contextmenu",(e)=>{

e.preventDefault();

});

});

});

/* Disable browser back after logout */

window.addEventListener("pageshow",(event)=>{

if(event.persisted){

window.location.reload();

}

});

/* Clear console */

setTimeout(()=>{

console.clear();

console.log(

"%cMarathon Digital Hub",

"color:#00ff88;font-size:18px;font-weight:bold;"

);

console.log(

"%cProtected System",

"color:#00c8ff;font-size:13px;"

);

},500);

/* Prevent multiple form submissions */

document.querySelectorAll("form").forEach(form=>{

form.addEventListener("submit",()=>{

const btn=form.querySelector("button[type='submit']");

if(btn){

btn.disabled=true;

btn.innerText="Please wait...";

}

});

});

/* Marathon Auth Loaded */

console.log("Marathon Auth & Security Loaded Successfully");
