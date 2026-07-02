const db = window.supabaseClient;

/* ==========================
LOAD PAYMENT SETTINGS
========================== */

document.addEventListener("DOMContentLoaded", () => {

    loadPaymentSettings();

});

async function loadPaymentSettings(){

    const { data, error } = await db

        .from("payment_settings")

        .select("*")

        .limit(1)

        .single();

    if(error){

        console.log(error);

        return;

    }

    if(!data) return;

    document.getElementById("method").value =
        data.method || "";

    document.getElementById("accountName").value =
        data.account_name || "";

    document.getElementById("phoneNumber").value =
        data.phone_number || "";

    document.getElementById("instructions").value =
        data.instructions || "";

    document.getElementById("isActive").checked =
        data.is_active;

    window.settingId = data.id;

}

/* ==========================
SAVE SETTINGS
========================== */

document
.getElementById("saveBtn")
.addEventListener("click", saveSettings);

async function saveSettings(){

    const btn=document.getElementById("saveBtn");

    const status=document.getElementById("statusMessage");

    btn.disabled=true;

    btn.innerHTML="Saving...";

    const payload={

        method:document.getElementById("method").value.trim(),

        account_name:document.getElementById("accountName").value.trim(),

        phone_number:document.getElementById("phoneNumber").value.trim(),

        instructions:document.getElementById("instructions").value.trim(),

        is_active:document.getElementById("isActive").checked

    };

    let error;

    if(window.settingId){

        ({ error } = await db

            .from("payment_settings")

            .update(payload)

            .eq("id",window.settingId));

    }else{

        ({ error } = await db

            .from("payment_settings")

            .insert(payload));

    }

    btn.disabled=false;

    btn.innerHTML="Save Settings";

    if(error){

        console.log(error);

        status.style.color="#ff5b5b";

        status.innerHTML="Failed to save settings.";

        return;

    }

    status.style.color="#00ff88";

    status.innerHTML="Settings saved successfully.";

    await loadPaymentSettings();

          }
