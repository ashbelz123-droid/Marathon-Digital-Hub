const db = window.supabaseClient;
const BRIDGE = 'admin-users-bridge';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function bridgeLogin(email, password) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data, error } = await db.functions.invoke(BRIDGE, {
        body: { action: 'login', email, password }
      });

      if (error) {
        lastError = error;
        if (attempt < 3) {
          await sleep(700 * attempt);
          continue;
        }
        throw new Error(error.message || 'Unable to reach admin authentication service');
      }

      if (!data?.ok) {
        throw new Error(data?.error || 'Invalid login credentials');
      }

      return data;
    } catch (err) {
      lastError = err;
      if (attempt < 3 && (err?.name === 'TypeError' || /fetch|network|timeout/i.test(err?.message || ''))) {
        await sleep(700 * attempt);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Unable to reach admin authentication service');
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
    localStorage.setItem('admin_name', data.admin.fullname || email);
    localStorage.setItem('admin_role', data.admin.role);
    localStorage.setItem('admin_id', data.admin.id);

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
  }
});
