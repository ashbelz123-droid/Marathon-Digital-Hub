const db = window.supabaseClient;
const BRIDGE_URL = `${SUPABASE_URL}/functions/v1/admin-users-bridge`;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function bridgeLogin(email, password) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      // Login does not require an authenticated bridge session. Use a
      // CORS-simple POST so the browser does not send a failing OPTIONS
      // preflight to the Edge Function.
      const response = await fetch(BRIDGE_URL, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
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

      const message = String(lastError?.message || '').toLowerCase();
      const retryable =
        err?.name === 'AbortError' ||
        /fetch|network|timeout|timed out|failed to send|load failed|connection/i.test(message);

      if (attempt < 3 && retryable) {
        const status = document.getElementById('message');
        if (status) status.innerHTML = `Connecting to secure admin service... (retry ${attempt}/2)`;
        await sleep(1000 * attempt);
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
    setTimeout(() => window.location.replace('admin-users.html'), 150);
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
