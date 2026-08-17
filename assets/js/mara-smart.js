/* Mara Smart Lite: local-first, low-cost assistant layer. Uses the signed-in user's own Supabase data for common questions and only falls back to the AI edge function when needed. */
(()=>{
  const db=()=>window.supabaseClient;
  const money=v=>'UGX '+Number(v||0).toLocaleString(undefined,{maximumFractionDigits:2});
  let ctx=null,ctxAt=0;
  const fresh=()=>ctx&&Date.now()-ctxAt<60000;
  async function load(){
    if(fresh())return ctx;
    const client=db(); if(!client)return null;
    const {data:{user}}=await client.auth.getUser(); if(!user)return null;
    const [p,m,t]=await Promise.all([
      client.from('profiles').select('fullname,membership,kyc_status,account_status,wallet_balance,referral_code,total_invested,total_profit,total_referral_bonus').eq('id',user.id).maybeSingle(),
      client.from('user_machines').select('id,machine_id,amount_paid,status,completed,created_at').eq('user_id',user.id),
      client.from('wallet_transactions').select('amount,type,status,created_at,description').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100)
    ]);
    if(p.error)throw p.error;
    const machines=m.data||[];
    let machineRows=[];
    if(machines.length){
      const ids=[...new Set(machines.map(x=>x.machine_id).filter(Boolean))];
      if(ids.length){const r=await client.from('machines').select('id,name,price,daily_income,duration_days,status,is_vip').in('id',ids);if(!r.error)machineRows=r.data||[];}
    }
    const transactions=t.data||[];
    const income=transactions.filter(x=>/mining income|income|profit/i.test(String(x.type||'')+' '+String(x.description||''))&&!/rejected|cancelled|failed/i.test(String(x.status||'')));
    const deposits=transactions.filter(x=>/deposit/i.test(String(x.type||''))&&!/rejected|cancelled|failed/i.test(String(x.status||'')));
    const withdrawals=transactions.filter(x=>/withdraw/i.test(String(x.type||''))&&!/rejected|cancelled|failed/i.test(String(x.status||'')));
    const active=machines.filter(x=>String(x.status||'').toLowerCase()==='active'&&!x.completed);
    ctx={user,p:p.data||{},machines,active,machineRows,transactions,income,deposits,withdrawals};ctxAt=Date.now();return ctx;
  }
  const has=(q,re)=>re.test(q);
  function localAnswer(q,c){
    const s=q.toLowerCase(); if(!c)return null; const p=c.p||{};
    if(has(s,/who am i|my name|my profile|account status|membership|kyc/)){
      return `Your MDH account: ${p.fullname||c.user.email||'User'}\nMembership: ${p.membership||'Standard'}\nKYC: ${p.kyc_status||'Not set'}\nAccount status: ${p.account_status||'Active'}`;
    }
    if(has(s,/wallet|balance|money do i have|how much.*(have|left)/))return `Your current wallet balance is ${money(p.wallet_balance)}.`;
    if(has(s,/how many.*machine|machines.*own|my machines|machine.*own/)){
      if(!c.machines.length)return 'You currently have no machine records linked to your account.';
      const lines=c.machines.slice(0,12).map((x,i)=>{const d=c.machineRows.find(z=>String(z.id)===String(x.machine_id));return `${i+1}. ${d?.name||'Machine'} — ${String(x.status||'active').toUpperCase()}${d?.daily_income!=null?' · '+money(d.daily_income)+'/day':''}`});
      return `You have ${c.machines.length} machine${c.machines.length===1?'':'s'} on your account.\n${lines.join('\n')}`;
    }
    if(has(s,/active machine|working machine|running machine/))return `You currently have ${c.active.length} active machine${c.active.length===1?'':'s'}.`;
    if(has(s,/income|profit|earn|earning|made/)&&has(s,/today|daily|day/)){
      const now=new Date();const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());const n=c.income.filter(x=>x.created_at&&new Date(x.created_at)>=start).reduce((a,x)=>a+Math.max(0,Number(x.amount||0)),0);return `Your recorded mining income today is ${money(n)}.`;
    }
    if(has(s,/income|profit|earn|earning/)&&has(s,/month|this month/)){
      const now=new Date();const start=new Date(now.getFullYear(),now.getMonth(),1);const n=c.income.filter(x=>x.created_at&&new Date(x.created_at)>=start).reduce((a,x)=>a+Math.max(0,Number(x.amount||0)),0);return `Your recorded mining income this month is ${money(n)}.`;
    }
    if(has(s,/total.*income|total.*profit|all.*income|all.*profit/))return `Your recorded mining income total is ${money(c.income.reduce((a,x)=>a+Math.max(0,Number(x.amount||0)),0))}.`;
    if(has(s,/invested|investment/))return `Your machine purchases recorded here total ${money(c.machines.reduce((a,x)=>a+Number(x.amount_paid||0),0)||p.total_invested)}.`;
    if(has(s,/deposit/))return 'To deposit, open Deposit, send the exact amount to the official payment account, then submit the amount, sender number and transaction ID. Your wallet is credited after admin verification.';
    if(has(s,/withdraw/))return 'To withdraw, open Withdraw and submit your request. If a request needs review, use Human Support.';
    if(has(s,/referral|team|bonus/))return `Your referral code is ${p.referral_code||'not set'} and your recorded referral bonus is ${money(p.total_referral_bonus)}.`;
    if(has(s,/status|working|problem|issue|error/)&&has(s,/account|wallet|machine|deposit|withdraw/))return 'I can check the data available on your MDH account, but I cannot approve or change account records. For an account issue that needs admin action, open Human Support.';
    if(has(s,/what can you do|help|commands/))return 'I can check your wallet, machines, active machines, income, investment records, referrals and basic account status. I can also guide you through deposits and withdrawals. For admin actions, use Human Support.';
    return null;
  }
  async function smart(q){
    try{const c=await load();const local=localAnswer(q,c);if(local)return local;
      const result=await window.supabaseClient.functions.invoke('mara-ai',{body:{message:q,context:{profile:c?.p||{},machines:(c?.machines||[]).map(x=>({machine_id:x.machine_id,status:x.status,amount_paid:x.amount_paid,completed:x.completed})),incomeCount:c?.income?.length||0}}});
      if(result.error)throw result.error;return result.data?.reply||'I could not complete that answer right now. Please try again or use Human Support.';
    }catch(e){console.warn('Mara Smart Lite:',e);return 'Mara could not read your account right now. Please try again shortly or use Human Support.';}
  }
  window.maraSmartAnswer=smart;
  window.maraRefreshContext=()=>{ctx=null;ctxAt=0;};
  const oldAnswer=window.answer;
  if(typeof oldAnswer==='function'){
    window.answer=async function(q){
      if(typeof window.add==='function'&&typeof window.thinking==='function'){
        window.add(q,'user');
        const input=document.getElementById('input'),btn=document.querySelector('#form button');
        if(input)input.value='';if(btn)btn.disabled=true;if(input)input.disabled=true;
        const pending=window.thinking();
        try{const r=await smart(q);pending.stop();if(typeof window.add==='function'&&typeof window.intentActions==='function')window.add(r,'mara',window.intentActions(q,r));else window.add(r,'mara');}
        finally{if(btn)btn.disabled=false;if(input){input.disabled=false;input.focus();}}
      }else return oldAnswer(q);
    };
  }
})();
