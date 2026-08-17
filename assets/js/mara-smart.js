/* Mara Smart Lite — local account answers + old ready replies when AI/account data is unavailable. */
(()=>{
  const client=()=>window.supabaseClient;
  const money=v=>'UGX '+Number(v||0).toLocaleString(undefined,{maximumFractionDigits:2});
  let cache=null,cacheTime=0;
  async function load(){
    if(cache&&Date.now()-cacheTime<60000)return cache;
    const c=client();if(!c)return null;
    const auth=await c.auth.getUser();if(auth.error||!auth.data?.user)return null;
    const uid=auth.data.user.id;
    const profile=await c.from('profiles').select('*').eq('id',uid).maybeSingle();
    const owned=await c.from('user_machines').select('*').eq('user_id',uid);
    if(profile.error)throw profile.error;if(owned.error)throw owned.error;
    const rows=owned.data||[];let catalog=[];const ids=[...new Set(rows.map(x=>x.machine_id).filter(Boolean))];
    if(ids.length){const r=await c.from('machines').select('id,name,price,daily_income,duration_days,status,is_vip').in('id',ids);if(!r.error)catalog=r.data||[];}
    cache={user:auth.data.user,profile:profile.data||{},owned:rows,catalog};cacheTime=Date.now();return cache;
  }
  function readyReply(q,x){
    const s=q.toLowerCase();
    if(/^(hi|hello|hey|yo)\b/.test(s))return 'Hey 👋 I’m Mara. Ask me about your wallet, machines, income, referrals or how to use MDH.';
    if(/bitcoin|btc/.test(s))return '__BITCOIN__';
    if(/machine/.test(s)&&/own|have|mine|my|how many/.test(s))return x&&x.owned.length?`You have ${x.owned.length} machine${x.owned.length===1?'':'s'} linked to your account.`:'I don’t see any machines linked to your account yet.';
    if(/machine/.test(s))return 'Open Machines to see available mining machines, prices, status and mining details.';
    if(/performance|earning|earnings/.test(s))return x?`Your dashboard is the source of truth for performance. I can see ${x.owned.length} machine${x.owned.length===1?'':'s'} linked to your account.`:'Your dashboard is the source of truth for account performance.';
    if(/notification|notifications/.test(s))return 'Open Notifications to see your real unread messages. The bell count represents unread records.';
    if(/dashboard/.test(s))return 'Open Dashboard for your wallet, machine overview, income and account activity.';
    if(/referral/.test(s))return 'Open Referrals to view your referral code, team and referral bonus.';
    if(/support|human|admin/.test(s))return 'For a person to review your issue, open Human Support and send a support message.';
    return null;
  }
  function accountAnswer(q,x){
    if(!x)return null;const s=q.toLowerCase(),p=x.profile||{};
    if(/wallet|balance|money.*have|money.*left/.test(s))return `Your current wallet balance is ${money(p.wallet_balance)}.`;
    if(/machine/.test(s)&&/own|have|mine|my|how many/.test(s)){
      if(!x.owned.length)return 'I don’t see any machines linked to your account yet.';
      const list=x.owned.slice(0,8).map((u,i)=>{const m=x.catalog.find(z=>String(z.id)===String(u.machine_id));return `${i+1}. ${m?.name||'Machine'} — ${String(u.status||'active').toUpperCase()}`}).join('\n');
      return `You have ${x.owned.length} machine${x.owned.length===1?'':'s'} linked to your account:\n${list}`;
    }
    if(/active|running|working/.test(s)&&/machine/.test(s)){const n=x.owned.filter(u=>!u.completed&&String(u.status||'').toLowerCase()==='active').length;return `You currently have ${n} active machine${n===1?'':'s'}.`;}
    if(/profit|total profit|earn|earning/.test(s)&&/total|all|overall/.test(s))return `Your profile shows total profit of ${money(p.total_profit)}.`;
    if(/invested|investment/.test(s))return `Your profile shows total invested of ${money(p.total_invested)}.`;
    if(/referral|team|bonus/.test(s))return `Referral code: ${p.referral_code||'not set'}\nReferral bonus: ${money(p.total_referral_bonus)}.`;
    if(/membership|kyc|account status|profile/.test(s))return `Account: ${p.fullname||x.user.email||'User'}\nMembership: ${p.membership||'Standard'}\nKYC: ${p.kyc_status||'Not set'}\nStatus: ${p.account_status||'Active'}`;
    if(/deposit/.test(s))return 'For a deposit, open Deposit, send the exact amount to the official payment account, then submit your amount, sender number and transaction ID. Admin verification credits the wallet.';
    if(/withdraw/.test(s))return 'For a withdrawal, open Withdraw and submit your request. If there is a problem, use Human Support.';
    if(/help|what can you do|what do you know/.test(s))return 'I can check your wallet, machines, total profit, investment, referrals and account status. I can also guide you around deposits and withdrawals.';
    return null;
  }
  async function bitcoin(){try{const r=await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',{cache:'no-store'});if(!r.ok)throw 0;const d=await r.json();return 'Bitcoin is currently around $'+Number(d.price).toLocaleString()+'. For trading decisions, always verify the market yourself.';}catch(e){return 'I could not reach the live Bitcoin feed right now.';}}
  async function smart(q){
    try{const x=await load();const local=accountAnswer(q,x);if(local)return local;const ready=readyReply(q,x);if(ready==='__BITCOIN__')return await bitcoin();if(ready)return ready;return 'I can help with your wallet, machines, total profit, investment, referrals, account status, deposits, withdrawals and basic MDH navigation. For anything else, use Human Support.';}
    catch(e){console.warn('Mara Smart Lite:',e);const ready=readyReply(q,null);if(ready==='__BITCOIN__')return await bitcoin();if(ready)return ready;return 'Mara could not read your account right now, but I can still answer basic MDH questions. Try asking about machines, Bitcoin, notifications, dashboard, referrals or support.';}
  }
  window.maraSmartAnswer=smart;window.maraRefreshContext=()=>{cache=null;cacheTime=0;};
})();
