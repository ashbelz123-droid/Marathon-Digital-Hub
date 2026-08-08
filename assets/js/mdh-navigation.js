/* MDH shared navigation + floating Mara + real dashboard data. */
(function(){
  if(!document.querySelector('.mdh-bottom-nav')){
    const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    const items=[['dashboard.html','⌂','Home'],['machines.html','◈','Machines'],['deposit.html','＋','Deposit'],['support.html','♡','Support'],['profile.html','◎','Profile']];
    const nav=document.createElement('nav');nav.className='mdh-bottom-nav';nav.setAttribute('aria-label','MDH main navigation');
    items.forEach(([href,icon,label])=>{const a=document.createElement('a');a.className='mdh-nav-item'+(path===href?' active':'');a.href=href;a.innerHTML='<span class="mdh-nav-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span>';nav.appendChild(a)});document.body.appendChild(nav)
  }
  function loadMara(){if(document.querySelector('.mara-float'))return;const s=document.createElement('script');s.src='assets/js/mara-floating.js';s.dataset.maraFloating='1';document.body.appendChild(s)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadMara,{once:true});else loadMara();
  async function loadRealDashboard(){
    if(!document.getElementById('walletBalance')&&!document.getElementById('activeMachines'))return;
    try{
      if(!window.supabaseClient)return;
      const {data:{user}}=await window.supabaseClient.auth.getUser();if(!user)return;
      const db=window.supabaseClient;
      const {data:p,error}=await db.from('profiles').select('*').eq('id',user.id).maybeSingle();if(error)throw error;
      const money=v=>'UGX '+Number(v||0).toLocaleString();const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
      set('walletBalance',money(p?.wallet_balance));set('totalInvested',money(p?.total_invested));set('totalProfit',money(p?.total_profit));set('referralBonus',money(p?.total_referral_bonus));set('userName',p?.fullname||user.email||'User');set('fullName',p?.fullname||'User');
      const active=await db.from('user_machines').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('status','active');if(!active.error)set('activeMachines',active.count||0);
      const notifTable=(await db.from('user_notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('is_read',false));
      const n=notifTable.error?0:(notifTable.count||0);const b=document.getElementById('notificationBadge');if(b){b.textContent=n;b.style.display=n>0?'grid':'none'}set('notificationCount',n);
      if(p?.referral_code){const team=await db.from('profiles').select('id',{count:'exact',head:true}).eq('referred_by',p.referral_code);if(!team.error)set('totalTeam',team.count||0)}
    }catch(e){console.warn('MDH dashboard data error',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadRealDashboard,{once:true});else loadRealDashboard();
})();