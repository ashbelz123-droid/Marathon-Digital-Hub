/* MDH shared navigation + floating Mara + real dashboard data. */
(function(){
  if(!document.querySelector('.mdh-bottom-nav')){
    const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    const items=[
      ['dashboard.html','⌂','Home'],
      ['machines.html','◈','Machines'],
      ['deposit.html','＋','Deposit'],
      ['support.html','♡','Support'],
      ['profile.html','◎','Profile']
    ];
    const nav=document.createElement('nav');
    nav.className='mdh-bottom-nav';
    nav.setAttribute('aria-label','MDH main navigation');
    items.forEach(([href,icon,label])=>{
      const a=document.createElement('a');
      a.className='mdh-nav-item'+(path===href?' active':'');
      a.href=href;
      a.innerHTML='<span class="mdh-nav-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span>';
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
  }

  function loadMara(){
    if(document.querySelector('.mara-float')||document.querySelector('script[data-mara-floating]')) return;
    const s=document.createElement('script');
    s.src='assets/js/mara-floating.js';
    s.dataset.maraFloating='1';
    document.body.appendChild(s);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadMara,{once:true}); else loadMara();

  async function loadRealDashboard(){
    if(!document.getElementById('walletBalance') && !document.getElementById('activeMachines')) return;
    try{
      if(!window.supabaseClient || !window.currentUser) return;
      const user=await window.currentUser();
      if(!user) return;
      const db=window.supabaseClient;
      const profileQ=await db.from('profiles').select('fullname,wallet_balance,total_invested,total_profit,total_referral_bonus,referral_code,membership,kyc_status,account_status').eq('id',user.id).maybeSingle();
      if(profileQ.error) throw profileQ.error;
      const p=profileQ.data||{};
      const money=v=>'UGX '+Number(v||0).toLocaleString();
      const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
      set('walletBalance',money(p.wallet_balance));
      set('totalInvested',money(p.total_invested));
      set('totalProfit',money(p.total_profit));
      set('referralBonus',money(p.total_referral_bonus));
      set('userName',p.fullname||user.email||'User');
      set('fullName',p.fullname||'User');
      set('membership',p.membership||'Standard');
      set('kycStatus',p.kyc_status||'Not Verified');
      set('accountStatus',p.account_status||'active');
      const active=await db.from('user_machines').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('status','active').eq('completed',false);
      if(!active.error)set('activeMachines',active.count||0);
      const unread=await db.from('user_notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('is_read',false);
      if(!unread.error){const n=unread.count||0;set('notificationCount',n);const b=document.getElementById('notificationBadge');if(b){b.textContent=n;b.style.display=n>0?'grid':'none'}}
      if(p.referral_code){
        const team=await db.from('profiles').select('id',{count:'exact',head:true}).eq('referred_by',p.referral_code);
        if(!team.error)set('totalTeam',team.count||0);
      }
    }catch(e){console.warn('MDH real dashboard data unavailable:',e)}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadRealDashboard,{once:true}); else loadRealDashboard();
})();
