const db = window.supabaseClient;

const ticketId = localStorage.getItem("selectedTicket");

/* ==========================
LOAD CONVERSATION
========================== */

document.addEventListener("DOMContentLoaded", () => {

    loadConversation();

    document
    .getElementById("sendBtn")
    .addEventListener("click", sendReply);

});

async function loadConversation(){

    if(!ticketId){

        alert("No ticket selected.");

        history.back();

        return;

    }

    const { data, error } = await db

    .from("support_messages")

    .select(`
        *,
        profiles(fullname)
    `)

    .eq("id", ticketId)

    .single();

    if(error){

        console.log(error);

        return;

    }

    document.getElementById("userName").innerHTML =
        data.profiles?.fullname || "Unknown User";

    const chat = document.getElementById("chatMessages");

    chat.innerHTML = "";

    chat.innerHTML += `
        <div class="user-message">
            ${data.message}
            <div class="message-time">
                ${new Date(data.created_at).toLocaleString()}
            </div>
        </div>
    `;

    if(data.admin_reply){

        chat.innerHTML += `
            <div class="admin-message">
                ${data.admin_reply}
                <div class="message-time">
                    Replied
                </div>
            </div>
        `;

    }

    chat.scrollTop = chat.scrollHeight;

      }
/* ==========================
SEND REPLY
========================== */

async function sendReply(){

    const input = document.getElementById("replyInput");
    const reply = input.value.trim();

    if(reply===""){
        alert("Type a reply first.");
        return;
    }

    const { data, error } = await db
    .from("support_messages")
    .select("*")
    .eq("id", ticketId)
    .single();

    if(error){
        console.log(error);
        return;
    }

    /* Save reply */

    const { error:updateError } = await db
    .from("support_messages")
    .update({
        admin_reply: reply,
        status: "closed"
    })
    .eq("id", ticketId);

    if(updateError){
        console.log(updateError);
        alert("Failed to send reply.");
        return;
    }

    /* Notify user */

    await db
    .from("user_notifications")
    .insert({
        user_id: data.user_id,
        title: "Support Reply",
        message: reply,
        type: "support",
        is_read: false
    });

    input.value = "";

    await loadConversation();

    alert("Reply sent successfully.");

}

/* ==========================
ENTER KEY TO SEND
========================== */

document
.getElementById("replyInput")
.addEventListener("keypress",function(e){

    if(e.key==="Enter"){

        e.preventDefault();

        sendReply();

    }

});
