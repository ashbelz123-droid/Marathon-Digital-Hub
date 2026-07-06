/* ==========================================
   MARATHON DIGITAL HUB SECURITY
   Part 1
========================================== */

/* Disable Right Click */

document.addEventListener("contextmenu", function(e){

e.preventDefault();

});

/* Disable Text Selection */

document.addEventListener("selectstart", function(e){

const tag = e.target.tagName.toLowerCase();

if(tag !== "input" && tag !== "textarea"){

e.preventDefault();

}

});

/* Disable Dragging */

document.addEventListener("dragstart", function(e){

e.preventDefault();

});

/* Disable Image Drag */

document.querySelectorAll("img").forEach(img=>{

img.setAttribute("draggable","false");

});

/* Remove Mobile Tap Highlight */

const style=document.createElement("style");

style.innerHTML=`

*{

-webkit-tap-highlight-color:transparent;

-webkit-touch-callout:none;

}

input,
textarea{

-webkit-touch-callout:default;

}

`;

document.head.appendChild(style);

/* ==========================================
   DISABLE COMMON SHORTCUTS
========================================== */

document.addEventListener("keydown",function(e){

/* F12 */

if(e.key==="F12"){

e.preventDefault();
return false;

}

/* CTRL + SHIFT + I */

if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="i"){

e.preventDefault();
return false;

}

/* CTRL + SHIFT + J */

if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="j"){

e.preventDefault();
return false;

}

/* CTRL + SHIFT + C */

if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="c"){

e.preventDefault();
return false;

}

/* CTRL + U */

if(e.ctrlKey && e.key.toLowerCase()==="u"){

e.preventDefault();
return false;

}

/* CTRL + S */

if(e.ctrlKey && e.key.toLowerCase()==="s"){

e.preventDefault();
return false;

}

/* CTRL + P */

if(e.ctrlKey && e.key.toLowerCase()==="p"){

e.preventDefault();
return false;

}

/* CTRL + A */

if(e.ctrlKey && e.key.toLowerCase()==="a"){

e.preventDefault();
return false;

}

/* CTRL + C */

if(e.ctrlKey && e.key.toLowerCase()==="c"){

e.preventDefault();
return false;

}

});

/* ==========================================
BLOCK COPY / CUT / PASTE
========================================== */

document.addEventListener("copy",e=>{

e.preventDefault();

});

document.addEventListener("cut",e=>{

e.preventDefault();

});

document.addEventListener("paste",function(e){

const tag=e.target.tagName.toLowerCase();

if(tag!=="input" && tag!=="textarea"){

e.preventDefault();

}

});

/* ==========================================
LOGIN PROTECTION
========================================== */

(async()=>{

/* Public Pages */

const publicPages=[

"login.html",

"register.html",

"forgot-password.html",

"reset-password.html",

"index.html"

];

/* Current Page */

const currentPage=window.location.pathname.split("/").pop();

/* Skip Public Pages */

if(publicPages.includes(currentPage)){

return;

}

/* Wait Until Supabase Loads */

if(!window.supabaseClient){

console.error("Supabase not loaded.");

return;

}

/* Check Login */

const {

data:{user},

error

}=await window.supabaseClient.auth.getUser();

if(error){

console.log(error);

}

if(!user){

window.location.replace("login.html");

return;

}

/* Save User Globally */

window.currentUser=user;

})();

/* ==========================================
SESSION MONITOR
========================================== */

window.supabaseClient.auth.onAuthStateChange((event,session)=>{

const publicPages=[

"login.html",

"register.html",

"forgot-password.html",

"reset-password.html",

"index.html"

];

const currentPage=window.location.pathname.split("/").pop();

/* Ignore Public Pages */

if(publicPages.includes(currentPage)){

return;

}

/* Session Expired */

if(!session){

window.location.replace("login.html");

return;

}

/* Update Global User */

window.currentUser=session.user;

});

/* ==========================================
DISABLE IMAGE SAVE
========================================== */

document.querySelectorAll("img").forEach(img=>{

img.setAttribute("draggable","false");

img.addEventListener("contextmenu",function(e){

e.preventDefault();

});

});

/* ==========================================
CONSOLE MESSAGE
========================================== */

console.clear();

console.log(

"%cMarathon Digital Hub",

"font-size:18px;color:#00ff88;font-weight:bold;"

);

console.log(

"%cProtected by Marathon Security.",

"color:#00c8ff;font-size:13px;"

);
