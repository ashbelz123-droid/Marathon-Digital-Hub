const db = window.supabaseClient;
const BRIDGE_URL = `${SUPABASE_URL}/functions/v1/admin-users-bridge`;

async function bridgeLogin(email, password) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(BRIDGE_URL, {
      method: 'POST', mode: 'cors', cache: 'no-store', signal: controller.signal,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ action: 'login', email, password })
    });
    const text = await response.text();
    let data = {}; try { data = text ? JSON.parse(text) : {}; } catch (_) {}
    if (!response.ok) throw new Error(data?.error || `Admin service returned HTTP ${response.status}`);
    if (!data?.ok || !data?.token) throw new Error(data?.error || 'Invalid admin login response');
    return data;
  } finally { clearTimeout(timeout); }
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');
  const msg = document.getElementById('message');
  if (!email || !password) { msg.className='message error'; msg.textContent='Enter your email and password.'; return; }
  btn.disabled = true; btn.textContent = 'Signing in…'; msg.className='message loading'; msg.textContent='';
  try {
    const data = await bridgeLogin(email, password);
    localStorage.setItem('admin_logged_in','true');
    localStorage.setItem('admin_bridge_token',data.token);
    localStorage.setItem('admin_name',data.admin?.fullname || email);
    localStorage.setItem('admin_role',data.admin?.role || 'admin');
    localStorage.setItem('admin_id',data.admin?.id || '');
    window.location.replace('admin.html');
  } catch (err) {
    localStorage.removeItem('admin_bridge_token'); localStorage.removeItem('admin_logged_in');
    btn.disabled=false; btn.textContent='Login'; msg.className='message error';
    msg.textContent=err?.name==='AbortError'?'Admin service timed out. Please try again.':(err?.message||'Unable to connect to admin service');
  }
});