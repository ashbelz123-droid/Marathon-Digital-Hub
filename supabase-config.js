/* ==========================================
   MARATHON DIGITAL HUB
   GLOBAL CONFIG V2
   PART 1
========================================== */

/* ==========================================
   SUPABASE CONFIGURATION
========================================== */

const SUPABASE_URL =
"https://sfimuvisljmezpajxxpf.supabase.co";

const SUPABASE_KEY =
"sb_publishable_Lg_uS6NX4c8kd8Vr6FnIZw_GyNS4SwY";

const { createClient } = supabase;

window.supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

/* ==========================================
   GLOBAL APP
========================================== */

window.MDH = {

    version: "2.0.0",

    online: navigator.onLine,

    started: false

};

console.log(
    "Marathon Digital Hub",
    "Global Config Loaded"
);

/* ==========================================
   HELPER FUNCTIONS
========================================== */

window.isLoggedIn = async function () {

    const { data } =
        await window.supabaseClient.auth.getUser();

    return !!data.user;

};

window.currentUser = async function () {

    const { data } =
        await window.supabaseClient.auth.getUser();

    return data.user;

};

window.formatMoney = function (amount) {

    return Number(amount || 0).toLocaleString();

};

window.nowISO = function () {

    return new Date().toISOString();

};

/* ==========================================
   PART 2
   GLOBAL COPY PROTECTION
========================================== */

/* Disable text selection except inputs */

document.addEventListener("selectstart", function (e) {

    const tag = e.target.tagName;

    if (

        tag === "INPUT" ||

        tag === "TEXTAREA" ||

        e.target.isContentEditable

    ) {

        return true;

    }

    e.preventDefault();

});

/* Disable copy */

document.addEventListener("copy", function (e) {

    const tag = e.target.tagName;

    if (

        tag === "INPUT" ||

        tag === "TEXTAREA"

    ) {

        return true;

    }

    e.preventDefault();

});

/* Disable cut */

document.addEventListener("cut", function (e) {

    const tag = e.target.tagName;

    if (

        tag === "INPUT" ||

        tag === "TEXTAREA"

    ) {

        return true;

    }

    e.preventDefault();

});

/* Disable drag */

document.addEventListener("dragstart", function (e) {

    e.preventDefault();

});

/* Disable image dragging */

document.querySelectorAll("img").forEach(function (img) {

    img.draggable = false;

});

/* Disable mobile long press */

document.addEventListener("contextmenu", function (e) {

    const tag = e.target.tagName;

    if (

        tag === "INPUT" ||

        tag === "TEXTAREA"

    ) {

        return true;

    }

    e.preventDefault();

});

/* CSS protection */

const style = document.createElement("style");

style.innerHTML = `

*{

-webkit-user-select:none;

-moz-user-select:none;

-ms-user-select:none;

user-select:none;

-webkit-touch-callout:none;

}

input,

textarea,

[contenteditable="true"]{

-webkit-user-select:text;

user-select:text;

-webkit-touch-callout:default;

}

img{

-webkit-user-drag:none;

user-drag:none;

pointer-events:auto;

}

`;

document.head.appendChild(style);

console.log("Global copy protection enabled.");

/* ==========================================
   PART 3
   KEYBOARD & DEVTOOLS PROTECTION
========================================== */

/* Block dangerous keyboard shortcuts */

document.addEventListener("keydown", function (e) {

    const tag = e.target.tagName;

    /* Allow normal typing in form fields */

    if (

        tag === "INPUT" ||

        tag === "TEXTAREA" ||

        e.target.isContentEditable

    ) {

        return;

    }

    const key = e.key.toLowerCase();

    /* Ctrl shortcuts */

    if (e.ctrlKey) {

        switch (key) {

            case "a":
            case "c":
            case "x":
            case "s":
            case "u":
            case "p":

                e.preventDefault();

                return;

        }

    }

    /* Ctrl + Shift shortcuts */

    if (

        e.ctrlKey &&

        e.shiftKey &&

        (

            key === "i" ||

            key === "j" ||

            key === "c"

        )

    ) {

        e.preventDefault();

        return;

    }

    /* F12 */

    if (e.key === "F12") {

        e.preventDefault();

        return;

    }

});

/* ==========================================
   BLOCK VIEW SOURCE
========================================== */

window.addEventListener("keydown", function (e) {

    if (

        e.ctrlKey &&

        e.key.toLowerCase() === "u"

    ) {

        e.preventDefault();

    }

});

/* ==========================================
   BLOCK SAVE PAGE
========================================== */

window.addEventListener("keydown", function (e) {

    if (

        e.ctrlKey &&

        e.key.toLowerCase() === "s"

    ) {

        e.preventDefault();

    }

});

/* ==========================================
   SIMPLE DEVTOOLS DETECTION
========================================== */

setInterval(() => {

    const widthDiff = window.outerWidth - window.innerWidth;

    const heightDiff = window.outerHeight - window.innerHeight;

    if (

        widthDiff > 160 ||

        heightDiff > 160

    ) {

        console.warn("Developer tools may be open.");

    }

}, 2000);

console.log("Keyboard protection enabled.");

/* ==========================================
   PART 4
   GLOBAL SECURITY
========================================== */

/* ==========================================
   ANTI-IFRAME
========================================== */

if (window.top !== window.self) {

    console.warn("Blocked iframe.");

    window.top.location = window.location.href;

}

/* ==========================================
   NETWORK STATUS
========================================== */

window.addEventListener("online", () => {

    MDH.online = true;

    console.log("Internet Connected");

});

window.addEventListener("offline", () => {

    MDH.online = false;

    console.warn("Internet Disconnected");

});

/* ==========================================
   SESSION MONITOR
========================================== */

async function verifySession() {

    try {

        const { data } =

            await window.supabaseClient

            .auth

            .getSession();

        if (!data.session) {

            console.log("No active session.");

            return;

        }

    } catch (error) {

        console.error(

            "Session Error:",

            error

        );

    }

}

setInterval(

    verifySession,

    60000

);

/* ==========================================
   AUTH STATE WATCHER
========================================== */

window.supabaseClient.auth.onAuthStateChange(

    (event) => {

        console.log(

            "Auth:",

            event

        );

    }

);

/* ==========================================
   PAGE VISIBILITY
========================================== */

document.addEventListener(

    "visibilitychange",

    () => {

        if (

            document.visibilityState === "visible"

        ) {

            verifySession();

        }

    }

);

/* ==========================================
   PREVENT MULTIPLE TABS
========================================== */

const TAB_KEY = "MDH_ACTIVE_TAB";

window.addEventListener("storage", (e) => {

    if (

        e.key === TAB_KEY &&

        e.newValue !== window.name

    ) {

        console.warn(

            "Another Marathon Digital Hub tab is active."

        );

    }

});

window.name =

    Math.random()

    .toString(36)

    .substring(2);

localStorage.setItem(

    TAB_KEY,

    window.name

);

console.log(

    "Global Security Loaded."

);

/* ==========================================
   PART 5
   GLOBAL UTILITIES & PRODUCTION
========================================== */

/* ==========================================
   SAFE DATABASE CALL
========================================== */

window.safeQuery = async function (callback) {

    try {

        return await callback();

    } catch (error) {

        console.error(

            "Database Error:",

            error

        );

        return null;

    }

};

/* ==========================================
   GLOBAL ERROR HANDLER
========================================== */

window.addEventListener("error", function (event) {

    console.error(

        "Application Error:",

        event.error

    );

});

window.addEventListener(

    "unhandledrejection",

    function (event) {

        console.error(

            "Unhandled Promise:",

            event.reason

        );

    }

);

/* ==========================================
   AUTO RECONNECT
========================================== */

window.addEventListener(

    "online",

    async () => {

        try {

            await verifySession();

        } catch (error) {

            console.error(error);

        }

    }

);

/* ==========================================
   APP VERSION
========================================== */

window.MDH.version = "2.1.0";

window.MDH.started = true;

/* ==========================================
   READY
========================================== */

console.log(

    "================================"

);

console.log(

    "MARATHON DIGITAL HUB"

);

console.log(

    "Global Config Version:",

    window.MDH.version

);

console.log(

    "Security: ACTIVE"

);

console.log(

    "Supabase: CONNECTED"

);

console.log(

    "Production Mode: ENABLED"

);

console.log(

    "================================"

);
