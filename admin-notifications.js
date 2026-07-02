const db = window.supabaseClient;

/* ==========================
LOAD NOTIFICATIONS
========================== */

document.addEventListener("DOMContentLoaded", () => {

    loadNotifications();

});

async function loadNotifications(){

    const { data, error } = await db

        .from("notifications")

        .select("*")

        .order("created_at",{ascending:false});

    if(error){

        console.log(error);

        document.getElementById("notificationList").innerHTML=
        "<p>Failed to load notifications.</p>";

        return;

    }

    const list=document.getElementById("notificationList");

    list.innerHTML="";

    if(data.length===0){

        list.innerHTML="<p>No notifications found.</p>";

        return;

    }

    data.forEach(item=>{

        list.innerHTML+=`

        <div class="notification-card">

            <h4>${item.title}</h4>

            <p>${item.message}</p>

            <small>

                ${item.type.toUpperCase()} •
                ${item.is_active ? "Active" : "Inactive"}

            </small>

        </div>

        `;

    });

          }

/* ==========================
PUBLISH NOTIFICATION
========================== */

document

.getElementById("sendBtn")

.addEventListener("click", publishNotification);

async function publishNotification(){

    const title=document.getElementById("title").value.trim();

    const message=document.getElementById("message").value.trim();

    const type=document.getElementById("type").value;

    const isActive=document.getElementById("isActive").checked;

    const status=document.getElementById("statusMessage");

    if(title==="" || message===""){

        status.style.color="#ff5b5b";

        status.innerHTML="Please complete all fields.";

        return;

    }

    document.getElementById("sendBtn").disabled=true;

    const { error } = await db

        .from("notifications")

        .insert({

            title:title,

            message:message,

            type:type,

            is_active:isActive,

            created_at:new Date().toISOString()

        });

    document.getElementById("sendBtn").disabled=false;

    if(error){

        console.log(error);

        status.style.color="#ff5b5b";

        status.innerHTML="Failed to publish notification.";

        return;

    }

    status.style.color="#00ff88";

    status.innerHTML="Notification published successfully.";

    document.getElementById("title").value="";

    document.getElementById("message").value="";

    document.getElementById("type").value="info";

    document.getElementById("isActive").checked=true;

    loadNotifications();

}
