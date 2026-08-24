const db=window.supabaseClient;
const userId=localStorage.getItem('selectedSupportUser');
let currentUser=null;
let sending=false;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

$('backBtn').onclick=()=>window.location.href='admin-support.html';

document.addEventListener('DOMContentLoaded',()=>{
 if(!userId){window.location.href='admin-support.html';return}
 loadChat();
});

async function loadChat(){
 const r=await db.from('support_messages').select('id,user_id,message,admin_reply,status,created_at,profiles(fullname)').eq('user_id',userId).order('created_at',{ascending:true});
 if(r.error){console.error(r.error);$('userName').textContent='Unable to load conversation';$('chatStatus').textContent=r.error.message;return}
 const messages=r.data||[];
 if(!messages.length){$('userName').textContent='Unknown User';$('chatStatus').textContent='No messages';$('chatContainer').innerHTML='<div class="loading">No messages yet.</div>';return}
 currentUser=messages[0].profiles||null;
 const name=currentUser?.fullname||'User '+userId.slice(0,8);
 $('userName').textContent=name;
 $('avatar').textContent=name.charAt(0).toUpperCase();
 const open=messages.some(m=>m.status==='open'&&!m.admin_reply);
 $('chatStatus').textContent=open?'Needs reply':'Conversation';
 const chat=$('chatContainer');chat.innerHTML='';
 for(const m of messages){
   if(m.message){chat.innerHTML+=`<div class="user-message">${esc(m.message)}<div class="message-time">${new Date(m.created_at).toLocaleString()}</div></div>`}
   if(m.admin_reply){chat.innerHTML+=`<div class="admin-message">${esc(m.admin_reply)}<div class="message-time">MDH Support · ${new Date(m.created_at).toLocaleString()}</div></div>`}
 }
 chat.scrollTop=chat.scrollHeight;
}

$('sendBtn').addEventListener('click',sendReply);
$('replyInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendReply()}});

async function sendReply(){
 if(sending)return;
 const input=$('replyInput');const reply=input.value.trim();
 if(!reply||!userId)return;
 sending=true;$('sendBtn').disabled=true;
 try{
   /* Attach the reply to the newest unanswered user message. This keeps
      the existing support_messages structure and does not create tickets. */
   const r=await db.from('support_messages').select('id').eq('user_id',userId).is('admin_reply',null).order('created_at',{ascending:false}).limit(1);
   if(r.error)throw r.error;
   if(!r.data?.length){$('chatStatus').textContent='No unanswered user message';return}
   const messageId=r.data[0].id;
   const u=await db.from('support_messages').update({admin_reply:reply,status:'closed'}).eq('id',messageId);
   if(u.error)throw u.error;
   const n=await db.from('user_notifications').insert({user_id:userId,title:'Support Reply',message:reply,type:'support',is_read:false,created_at:new Date().toISOString()});
   if(n.error)console.warn('Notification failed',n.error);
   input.value='';
   await loadChat();
 }catch(e){console.error(e);alert('Failed to send reply. Please try again.')}finally{sending=false;$('sendBtn').disabled=false}
}

setInterval(loadChat,10000);