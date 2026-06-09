async function loadUser() {

const {
data:{user}
} = await supabaseClient.auth.getUser();

if(!user){
window.location.href="login.html";
return;
}

console.log(user.email);

}

loadUser();
