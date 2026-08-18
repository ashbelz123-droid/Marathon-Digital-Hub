/* MARATHON DIGITAL HUB - MINING ENGINE V4.0 */
const db = window.supabaseClient;
let currentUser = null;
let currentProfile = null;
let siteSettings = null;
let userMachines = [];
let miningEngineRunning = false;

function kampalaNow(){return new Date(new Date().toLocaleString('en-US',{timeZone:'Africa/Kampala'}));}
function isWeekendKampala(){const d=kampalaNow().getDay();return d===0||d===6;}
function machineIsVip(machineRecord,machine){return Boolean(machine?.is_vip||machineRecord?.is_vip);}

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

/*
 * V4 rule: weekend eligibility is enforced by the database mining engine.
 * We intentionally do NOT write paused=true from the browser anymore.
 * This prevents a client-side weekend pause from blocking the server cron
 * and keeps the machine lifecycle authoritative in Supabase.
 */
async function syncWeekendMachineState(){return;}

async function processAllMachines(){
  if(!currentProfile)return;
  await syncWeekendMachineState();
  for(const machineRecord of userMachines){
    try{await processSingleMachine(machineRecord);}catch(error){console.error('Machine Processing Error:',machineRecord.id,error);}
  }
}

async function processSingleMachine(machineRecord){
  const machine=machineRecord.machines;
  if(!machine||machineRecord.completed===true||String(machineRecord.status||'').toLowerCase()!=='active')return;
  if(machineRecord.paused===true)return;
  /* Never mark a machine completed directly in the browser.
     The database RPC decides whether an earning day is due, whether the
     machine is complete, and whether the single final payout is released. */
  await processMachineIncome(machineRecord,machine);
}

/*
 * The database RPC is the only financial authority.
 * Earnings accumulate inside user_machines. The wallet is untouched until
 * the machine reaches its required earning days, at which point one
 * Mining Completion transaction releases the remaining promised return.
 */
async function processMachineIncome(machineRecord,machine){
  const {data,error}=await db.rpc('process_mining_income',{p_machine_id:machineRecord.id});
  if(error){console.error('Mining engine RPC error:',machineRecord.id,error);return;}
  if(!data?.success)return;

  machineRecord.earned_amount=Number(data.earned_amount??machineRecord.earned_amount??0);
  machineRecord.current_day=Number(data.current_day??machineRecord.current_day??0);
  machineRecord.remaining_days=Number(data.remaining_days??machineRecord.remaining_days??0);
  machineRecord.completed=Boolean(data.completed);
  machineRecord.status=data.completed?'completed':'active';

  const payout=Number(data.payout||0);
  if(payout>0){
    currentProfile.wallet_balance=Number(currentProfile.wallet_balance||0)+payout;
    currentProfile.total_profit=Number(currentProfile.total_profit||0)+payout;
  }

  if(data.completed){
    machineRecord.completed_at=new Date().toISOString();
  }
}

async function runMiningEngine(){
  try{
    await initializeMiningEngine();
    if(!currentUser||!currentProfile||!userMachines.length)return;
    await processAllMachines();
  }catch(error){console.error('Mining Engine Error:',error);}
}

async function startMiningEngine(){
  if(miningEngineRunning)return;
  miningEngineRunning=true;
  try{await runMiningEngine();}finally{miningEngineRunning=false;}
}

document.addEventListener('DOMContentLoaded',startMiningEngine);
window.addEventListener('online',startMiningEngine);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')startMiningEngine();});
window.addEventListener('focus',startMiningEngine);
db.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN')startMiningEngine();});

const MINING_ENGINE_VERSION='4.0.0';
console.log('MDH Mining Engine',MINING_ENGINE_VERSION,'— server-authoritative accumulation, payout on completion only');
