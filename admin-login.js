const db = window.supabaseClient;
const BRIDGE_URL = `${SUPABASE_URL}/functions/v1/admin-users-bridge`;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function bridgeLogin(email, password) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(BRIDGE_URL, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ action: 'login', email, password })
      });

      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) {}

      if (!response.ok) {
        throw new Error(data?.error || `Admin service returned HTTP ${response.status}`);
      }

      if (!data?.ok || !data?.token) {
        throw new Error(data?.error || 'Admin service returned an invalid response');
      }

      return data;
    } catch (err) {
      lastError = err?.name === 'AbortError'
        ? new Error('Admin service timed out. Please try again.')
        : err;

      if (attempt < 3 && /fetch|network|timeout|failed to send|load failed/i.test(lastError?.message || '')) {
        await sleep(800 * attempt);
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('Unable to reach admin service');
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');
  const msg = document.getElementById('message');

  btn.disabled = true;
  btn.innerHTML = 'Logging in...';
  msg.className = 'message loading';
  msg.innerHTML = 'Connecting to secure admin service...';

  try {
    const data = await bridgeLogin(email, password);

    localStorage.setItem('admin_logged_in', 'true');
    localStorage.setItem('admin_bridge_token', data.token);
    localStorage.setItem('admin_name', data.admin?.fullname || email);
    localStorage.setItem('admin_role', data.admin?.role || 'admin');
    localStorage.setItem('admin_id', data.admin?.id || '');

    msg.className = 'message success';
    msg.innerHTML = 'Login successful...';
    setTimeout(() => window.location.href = 'admin-users.html', 250);
  } catch (err) {
    localStorage.removeItem('admin_bridge_token');
    localStorage.removeItem('admin_logged_in');
    btn.disabled = false;
    btn.innerHTML = 'Login';
    msg.className = 'message error';
    msg.innerHTML = err?.message || 'Unable to connect to admin service';
    console.error('MDH admin login:', err);
  }
});
