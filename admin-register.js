const db = window.supabaseClient;

document
.getElementById("registerBtn")
.addEventListener("click", registerAdmin);

async function registerAdmin(){

    const fullname =
    document.getElementById("fullname").value.trim();

    const email =
    document.getElementById("email").value.trim();

    const password =
    document.getElementById("password").value.trim();

    const role =
    document.getElementById("role").value;

    const status =
    document.getElementById("statusMessage");

    if(
        fullname==="" ||
        email==="" ||
        password===""){
        
        status.style.color="#ff5555";
        status.innerHTML="Please fill all fields.";
        return;
    }

    document.getElementById("registerBtn").disabled=true;

    const { data,error } = await db

    .from("admins")

    .insert([{

        fullname:fullname,

        email:email,

        password:password,

        role:role

    }])

    .select()

    .single();

    document.getElementById("registerBtn").disabled=false;

    if(error){

        console.log(error);

        status.style.color="#ff5555";

        status.innerHTML=error.message;

        return;

    }

    /* SAVE ADMIN SESSION */

    localStorage.setItem(
        "admin",
        JSON.stringify(data)
    );

    status.style.color="#00ff88";

    status.innerHTML="Registration successful...";

    setTimeout(()=>{

        window.location.href="admin-dashboard.html";

    },1000);

      }

/* ==========================
CHECK ADMIN SESSION
========================== */

const admin = JSON.parse(localStorage.getItem("admin"));

if (!admin) {

    window.location.href = "admin-register.html";

}

/* SHOW ADMIN DETAILS */

const adminName = document.getElementById("adminName");

if (adminName) {

    adminName.textContent = admin.fullname;

}

/* LOGOUT */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("admin");

        window.location.href = "admin-register.html";

    });

}
