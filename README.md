<script>
function showPage(id, element) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  document.querySelectorAll('.nav').forEach(n => n.classList.remove('active'));
  element.classList.add('active');

  const names = {
    overview:'Overview',
    music:'Music System',
    tickets:'Ticket System',
    invoices:'Invoices',
    security:'Security',
    welcome:'Welcome System',
    settings:'Settings'
  };

  document.getElementById('pageTitle').textContent = names[id];
}

function discordLogin() {
  window.location.href = '/api/auth/login';
}

async function checkLogin() {
  const button = document.querySelector('.login');

  try {
    const response = await fetch('/api/me');
    if (!response.ok) return;

    const data = await response.json();

    if (data.loggedIn) {
      button.textContent = data.user.global_name || data.user.username;

      button.onclick = async () => {
        await fetch('/api/logout');
        location.reload();
      };
    }
  } catch (error) {
    console.error('Login check failed');
  }
}

checkLogin();
</script>
