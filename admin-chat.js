const db = window.supabaseClient;

const ticketId = localStorage.getItem("selectedTicket");

let currentTicket = null;

/* ==========================
BACK BUTTON
========================== */

document.getElementById("backBtn").onclick = () => {

    window.location.href = "admin-support.html";

};

/* ==========================
PAGE LOAD
========================== */

document.addEventListener("DOMContentLoaded", () => {

    if (!ticketId) {

        alert("No chat selected.");

        window.location.href = "admin-support.html";

        return;

    }

    loadChat();

});

/* ==========================
LOAD CHAT
========================== */

async function loadChat() {

    const { data, error } = await db

        .from("support_messages")

        .select(`
            *,
            profiles(fullname)
        `)

        .eq("id", ticketId)

        .single();

    if (error) {

        console.log(error);

        return;

    }

    currentTicket = data;

    /* MARK AS READ */

    await db

        .from("support_messages")

        .update({
            status: "read"
        })

        .eq("id", ticketId);

    /* HEADER */

    document.getElementById("userName").textContent =
        data.profiles?.fullname || "Unknown User";

    document.getElementById("avatar").textContent =
        (data.profiles?.fullname || "U")
        .charAt(0)
        .toUpperCase();

    /* CHAT */

    const chat = document.getElementById("chatContainer");

    chat.innerHTML = "";

    chat.innerHTML += `

        <div class="user-message">

            ${data.message}

            <div class="message-time">

                ${new Date(data.created_at).toLocaleString()}

            </div>

        </div>

    `;

    if (data.admin_reply) {

        chat.innerHTML += `

            <div class="admin-message">

                ${data.admin_reply}

                <div class="message-time">

                    Admin

                </div>

            </div>

        `;

    }

    chat.scrollTop = chat.scrollHeight;

}

/* ==========================
SEND REPLY
========================== */

document
.getElementById("sendBtn")
.addEventListener("click", sendReply);

document
.getElementById("replyInput")
.addEventListener("keypress", function(e){

    if(e.key==="Enter"){

        e.preventDefault();

        sendReply();

    }

});

async function sendReply(){

    const input=document.getElementById("replyInput");

    const reply=input.value.trim();

    if(reply===""){

        alert("Please type a reply.");

        return;

    }

    document.getElementById("sendBtn").disabled=true;

    /* UPDATE SUPPORT MESSAGE */

    const { error } = await db

        .from("support_messages")

        .update({

            admin_reply: reply,

            status: "closed"

        })

        .eq("id", ticketId);

    if(error){

        console.log(error);

        alert("Failed to send reply.");

        document.getElementById("sendBtn").disabled=false;

        return;

    }

    /* CREATE USER NOTIFICATION */

    await db

        .from("user_notifications")

        .insert({

            user_id: currentTicket.user_id,

            title: "Support Reply",

            message: reply,

            type: "support",

            is_read: false,

            created_at: new Date().toISOString()

        });

    input.value="";

    document.getElementById("sendBtn").disabled=false;

    await loadChat();

    alert("Reply sent successfully.");

}

/* ==========================
AUTO REFRESH
========================== */

setInterval(loadChat,10000);
