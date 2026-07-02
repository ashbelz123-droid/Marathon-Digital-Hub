const db = window.supabaseClient;

/* ==========================
ALREADY LOGGED IN
========================== */

if(localStorage.getItem("admin_logged_in")==="true"){

window.location.href="admin-dashboard.html";

}

/* ==========================
LOGIN
========================== */

document.getElementById("loginForm")

.addEventListener("submit",async(e)=>{

e.preventDefault();

const email=document.getElementById("email").value.trim();

const password=document.getElementById("password").value.trim();

const btn=document.getElementById("loginBtn");

const msg=document.getElementById("message");

btn.disabled=true;

btn.innerHTML="Logging in...";

msg.className="message loading";

msg.innerHTML="Please wait...";

/* CHECK ADMIN */

const {data,error}=await db

.from("admins")

.select("*")

.eq("email",email)

.eq("password",password)

.single();

if(error || !data){

btn.disabled=false;

btn.innerHTML="Login";

msg.className="message error";

msg.innerHTML="Invalid email or password.";

return;

}

/* SAVE SESSION */

localStorage.setItem("admin_logged_in","true");

localStorage.setItem("admin_name",data.fullname);

localStorage.setItem("admin_role",data.role);

localStorage.setItem("admin_id",data.id);

/* SUCCESS */

msg.className="message success";

msg.innerHTML="Login successful...";

setTimeout(()=>{

window.location.href="admin-dashboard.html";

},800);

});
