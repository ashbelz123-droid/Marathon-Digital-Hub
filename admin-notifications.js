const db = window.supabaseClient;
const PUSH_URL = `${SUPABASE_URL}/functions/v1/send-push-notification`;

document.addEventListener('DOMContentLoaded', () => { loadNotifications(); });

async function loadNotifications(){
 const { data, error } = await db.from('notifications').select('*').order('created_at',{ascending:false});
 if(error){document.getElementById('notificationList').innerHTML='<p>Failed to load notifications.</p>';return;}
 const list=document.getElementById('notificationList');list.innerHTML='';
 if(!data?.length){list.innerHTML='<p>No notifications found.</p>';return;}
 data.forEach(item=>{list.innerHTML+=`<div class="notification-card"><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.message)}</p><small>${escapeHtml(item.type||'info').toUpperCase()} • ${item.is_active?'Active':'Inactive'}</small></div>`});
}

document.getElementById('sendBtn').addEventListener('click', publishNotification);

async function publishNotification(){
 const title=document.getElementById('title').value.trim(),message=document.getElementById('message').value.trim(),type=document.getElementById('type').value,isActive=document.getElementById('isActive').checked,status=document.getElementById('statusMessage'),btn=document.getElementById('sendBtn');
 if(!title||!message){status.style.color='#ff5b5b';status.innerHTML='Please complete all fields.';return}
 btn.disabled=true;status.style.color='';status.innerHTML='Publishing notification...';
 const {data,error}=await db.from('notifications').insert({title,message,type,is_active:isActive,created_at:new Date().toISOString()}).select('id').single();
 if(error){btn.disabled=false;status.style.color='#ff5b5b';status.innerHTML='Failed to publish notification.';console.error(error);return}
 let pushText='';
 try{
  const token=localStorage.getItem('admin_bridge_token');
  if(!token)throw new Error('Admin session token missing');
  const response=await fetch(PUSH_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({title,message,url:'/notifications.html'})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.error||`Push service returned ${response.status}`);
  pushText=result.sent>0?` Phone push sent to ${result.sent} device${result.sent===1?'':'s'}.`:' No phones are subscribed yet.';
 }catch(e){console.warn('Phone push:',e);pushText=' In-app notification was published; phone push could not be sent.'}
 btn.disabled=false;status.style.color='#00ff88';status.innerHTML='Notification published successfully.'+pushText;
 document.getElementById('title').value='';document.getElementById('message').value='';document.getElementById('type').value='info';document.getElementById('isActive').checked=true;loadNotifications();
}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}