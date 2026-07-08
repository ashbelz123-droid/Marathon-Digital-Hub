/*=========================================
MARATHON DIGITAL HUB
REGISTER.JS
PART 1
=========================================*/

const db = window.supabaseClient;

/*==============================
ELEMENTS
==============================*/

const form = document.getElementById("registerForm");

const fullName = document.getElementById("fullname");
const phone = document.getElementById("phone");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const referral = document.getElementById("referral");

const registerBtn = document.getElementById("registerBtn");

const messageBox = document.getElementById("messageBox");

const loadingScreen = document.getElementById("loadingScreen");

/*==============================
AUTO REFERRAL
==============================*/

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);

    const ref = params.get("ref");

    if (ref) {

        referral.value = ref.toUpperCase();

    }

});

/*==============================
MESSAGE BOX
==============================*/

function showMessage(message, success = false) {

    messageBox.style.display = "block";

    messageBox.innerHTML = message;

    if (success) {

        messageBox.style.background = "#103d27";
        messageBox.style.color = "#00ff88";

    } else {

        messageBox.style.background = "#401818";
        messageBox.style.color = "#ff5b5b";

    }

}

/*==============================
LOADING
==============================*/

function showLoading() {

    loadingScreen.style.display = "flex";

}

function hideLoading() {

    loadingScreen.style.display = "none";

}

/*==============================
PASSWORD VISIBILITY
==============================*/

document.getElementById("showPassword")

.addEventListener("change", function () {

    const type = this.checked ? "text" : "password";

    password.type = type;

    confirmPassword.type = type;

});

/*=========================================
REGISTER.JS
PART 2
Password Strength + Validation
=========================================*/

/*==============================
PASSWORD STRENGTH
==============================*/

const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

password.addEventListener("input", checkPasswordStrength);

function checkPasswordStrength() {

    const pass = password.value;

    let score = 0;

    const hasLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);

    updateRule("ruleLength", hasLength);
    updateRule("ruleUpper", hasUpper);
    updateRule("ruleLower", hasLower);
    updateRule("ruleNumber", hasNumber);
    updateRule("ruleSpecial", hasSpecial);

    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    switch (score) {

        case 0:
        case 1:

            strengthBar.style.width = "20%";
            strengthBar.style.background = "#ff3b30";
            strengthText.innerHTML = "Very Weak";
            break;

        case 2:

            strengthBar.style.width = "40%";
            strengthBar.style.background = "#ff9500";
            strengthText.innerHTML = "Weak";
            break;

        case 3:

            strengthBar.style.width = "60%";
            strengthBar.style.background = "#ffd60a";
            strengthText.innerHTML = "Medium";
            break;

        case 4:

            strengthBar.style.width = "80%";
            strengthBar.style.background = "#34c759";
            strengthText.innerHTML = "Strong";
            break;

        case 5:

            strengthBar.style.width = "100%";
            strengthBar.style.background = "#00c853";
            strengthText.innerHTML = "Excellent";
            break;

    }

}

/*==============================
UPDATE RULE
==============================*/

function updateRule(id, valid) {

    const rule = document.getElementById(id);

    if (!rule) return;

    if (valid) {

        rule.innerHTML =
        "✅ " + rule.textContent.replace("❌ ", "").replace("✅ ", "");

        rule.style.color = "#00ff88";

    } else {

        rule.innerHTML =
        "❌ " + rule.textContent.replace("❌ ", "").replace("✅ ", "");

        rule.style.color = "#ff5b5b";

    }

}

/*==============================
PASSWORD MATCH
==============================*/

confirmPassword.addEventListener("input", () => {

    if (

        confirmPassword.value &&
        confirmPassword.value !== password.value

    ) {

        confirmPassword.style.borderColor = "#ff4d4f";

    } else {

        confirmPassword.style.borderColor = "#00C8FF";

    }

});

/*=========================================
REGISTER.JS
PART 3
Registration
=========================================*/

form.addEventListener("submit", async (e) => {

e.preventDefault();

messageBox.style.display = "none";

const fullnameValue = fullName.value.trim();
const phoneValue = phone.value.trim();
const emailValue = email.value.trim().toLowerCase();
const passwordValue = password.value;
const confirmValue = confirmPassword.value;
const referralValue = referral.value.trim().toUpperCase();

/*==============================
BASIC VALIDATION
==============================*/

if(!fullnameValue || !phoneValue || !emailValue ||
!passwordValue || !confirmValue || !referralValue){

showMessage("Please fill in all fields.");

return;

}

if(passwordValue !== confirmValue){

showMessage("Passwords do not match.");

return;

}

const strongPassword =
passwordValue.length >= 8 &&
/[A-Z]/.test(passwordValue) &&
/[a-z]/.test(passwordValue) &&
/[0-9]/.test(passwordValue) &&
/[^A-Za-z0-9]/.test(passwordValue);

if(!strongPassword){

showMessage(
"Password is too weak."
);

return;

}

showLoading();

try{

/*==============================
CHECK REFERRAL
==============================*/

const { data: refProfile } = await db

.from("profiles")

.select("id")

.eq("referral_code", referralValue)

.maybeSingle();

if(!refProfile){

hideLoading();

showMessage("Invalid referral code.");

return;

}

/*==============================
CHECK EMAIL
==============================*/

const { data: emailExists } = await db

.from("profiles")

.select("id")

.eq("email", emailValue)

.maybeSingle();

if(emailExists){

hideLoading();

showMessage("Email already exists.");

return;

}

/*==============================
CHECK PHONE
==============================*/

const { data: phoneExists } = await db

.from("profiles")

.select("id")

.eq("phone", phoneValue)

.maybeSingle();

if(phoneExists){

hideLoading();

showMessage("Phone number already exists.");

return;

}

/*==============================
CREATE AUTH USER
==============================*/

const {

data: authData,

error: authError

} = await db.auth.signUp({

email: emailValue,

password: passwordValue

});

if(authError) throw authError;

const user = authData.user;

if(!user) throw new Error("Unable to create account.");

/*==============================
GENERATE USER REFERRAL CODE
==============================*/

const myReferral =

"MDH" +

Math.random()

.toString(36)

.substring(2,8)

.toUpperCase();

/*==============================
CREATE PROFILE
==============================*/

const { error: profileError } = await db

.from("profiles")

.insert({

id:user.id,

fullname:fullnameValue,

phone:phoneValue,

email:emailValue,

wallet_balance:0,

membership:"Standard",

account_status:"active",

level:1,

referred_by:referralValue,

referral_code:myReferral

});

if(profileError) throw profileError;

hideLoading();

showMessage(

"Account created successfully. Please check your email before logging in.",

true

);

setTimeout(()=>{

location.href="login.html";

},2000);

}catch(err){

hideLoading();

showMessage(err.message || "Registration failed.");

}

});
