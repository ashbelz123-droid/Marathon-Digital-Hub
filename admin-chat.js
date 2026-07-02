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
