/* MARATHON DIGITAL HUB - MINING ENGINE V3.2 */
const db = window.supabaseClient;
let currentUser = null;
let currentProfile = null;
let siteSettings = null;
let userMachines = [];
let miningEngineRunning = false;

function kampalaNow(){return new Date(new Date().toLocaleString('en-US',{timeZone:'Africa/Kampala'}));}
function isWeekendKampala(){const d=kampalaNow().getDay();return d===0||d===6;}
function machineIsVip(machineRecord,machine){return Boolean(machine?.is_vip||machineRecord?.is_vip);}
const WEEKEND_NOTE='MDH_AUTO_WEEKEND_PAUSE';

async function initializeMiningEngine(){
  const {data,error}=await db.auth.getUser();
  if(error||!data.user){currentUser=null;return;}
  currentUser=data.user;
  await loadProfile();
  await loadSiteSettings();
  await loadUserMachines();
}
async function loadProfile(){const {data,error}=await db.from('profiles').select('*').eq('id',currentUser.id).single();if(error)throw error;currentProfile=data;}
async function loadSiteSettings(){const {data,error}=await db.from('site_settings').select('*').order('updated_at',{ascending:false}).limit(1).maybeSingle();siteSettings=error||!data?{weekend_enabled:true}:data;}
async function loadUserMachines(){const {data,error}=await db.from('user_machines').select(`*,machines(id,name,total_return,duration_days,daily_income,is_vip)`).eq('user_id',currentUser.id).order('purchase_date',{ascending:true});if(error)throw error;userMachines=data||[];}

/* Weekend means an actual database pause for non-VIP machines.
   Only this engine's own WEEKEND_NOTE is ever reversed, so an admin pause
   is never accidentally overwritten on Monday. VIP machines remain active. */
async function syncWeekendMachineState(){
  const weekendEnabled=Boolean(siteSettings?.weekend_enabled)!==false;
  const weekend=weekendEnabled&&isWeekendKampala();
  for(const record of userMachines){
    if(record.completed||String(record.status||'').toLowerCase()!=='active')continue;
    const vip=machineIsVip(record,record.machines);
    const autoPaused=String(record.notes||'').includes(WEEKEND_NOTE);
    if(weekend&&!vip&&!record.paused){
      const {error}=await db.from('user_machines').update({paused:true,paused_at:new Date().toISOString(),notes:WEEKEND_NOTE,updated_at:new Date().toISOString()}).eq('id',record.id).eq('user_id',currentUser.id);
      if(error)console.error('Weekend pause failed:',record.id,error);else{record.paused=true;record.paused_at=new Date().toISOString();record.notes=WEEKEND_NOTE;}
    }else if(!weekend&&record.paused&&autoPaused){
      const {error}=await db.from('user_machines').update({paused:false,resumed_at:new Date().toISOString(),notes:null,updated_at:new Date().toISOString()}).eq('id',record.id).eq('user_id',currentUser.id);
      if(error)console.error('Weekend resume failed:',record.id,error);else{record.paused=false;record.resumed_at=new Date().toISOString();record.notes=null;}
    }
  }
}

async function processAllMachines(){
  if(!currentProfile)return;
  await syncWeekendMachineState();
  const weekendBlocked=Boolean(siteSettings?.weekend_enabled)!==false&&isWeekendKampala();
  for(const machineRecord of userMachines){try{const machine=machineRecord.machines;if(weekendBlocked&&!machineIsVip(machineRecord,machine))continue;await processSingleMachine(machineRecord);}catch(error){console.error('Machine Processing Error:',machineRecord.id,error);}}
}
async function processSingleMachine(machineRecord){const machine=machineRecord.machines;if(!machine||machineRecord.completed===true||String(machineRecord.status||'').toLowerCase()!=='active')return;if(machineRecord.paused===true)return;if(machineRecord.expiry_date&&Date.now()>=new Date(machineRecord.expiry_date).getTime()){await completeMachine(machineRecord.id);return;}await processMachineIncome(machineRecord,machine);}
/* Database RPC remains the final payout authority: Kampala date, weekend VIP rule,
   one payout/day, return cap, wallet update and transaction are atomic. */
async function processMachineIncome(machineRecord,machine){const {data,error}=await db.rpc('process_mining_income',{p_machine_id:machineRecord.id});if(error){console.error('Mining payout RPC error:',machineRecord.id,error);return;}if(!data?.success)return;currentProfile.wallet_balance=Number(data.balance_after??currentProfile.wallet_balance);if(data.amount!=null)currentProfile.total_profit=Number(currentProfile.total_profit||0)+Number(data.amount);machineRecord.earned_amount=Number(machineRecord.earned_amount||0)+Number(data.amount||0);machineRecord.last_profit_date=new Date().toISOString();machineRecord.completed=Boolean(data.completed);machineRecord.status=data.completed?'completed':'active';}
async function completeMachine(machineId){const {error}=await db.from('user_machines').update({completed:true,status:'completed',completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',machineId).eq('user_id',currentUser?.id);if(error)console.error('Complete Machine Error:',error);}
async function runMiningEngine(){try{await initializeMiningEngine();if(!currentUser||!currentProfile||!userMachines.length)return;await processAllMachines();}catch(error){console.error('Mining Engine Error:',error);}}
async function startMiningEngine(){if(miningEngineRunning)return;miningEngineRunning=true;try{await runMiningEngine();}finally{miningEngineRunning=false;}}
document.addEventListener('DOMContentLoaded',startMiningEngine);window.addEventListener('online',startMiningEngine);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')startMiningEngine();});window.addEventListener('focus',startMiningEngine);db.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN')startMiningEngine();});
const MINING_ENGINE_VERSION='3.2.0';console.log('MDH Mining Engine',MINING_ENGINE_VERSION,'— weekend: non-VIP PAUSED, VIP ACTIVE');
