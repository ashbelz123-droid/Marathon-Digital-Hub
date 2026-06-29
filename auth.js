const SUPABASE_URL =
"https://wcrrxsrtbelcbycppieg.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcnJ4c3J0YmVsY2J5Y3BwaWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MTM0ODQsImV4cCI6MjA5NjE4OTQ4NH0.yh_xCiEW2T9riiDJgEWBmIU4V0e5azRQ0sITaEhfCo4";

const supabase =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

async function requireAuth(){

const {
data:{user}
}

await supabase.auth.getUser();

if(!user){

window.location =
"login.html";

return null;

}

return user;

}

async function logout(){

await supabase.auth.signOut();

window.location =
"login.html";

}
