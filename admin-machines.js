/*==================================
MARATHON DIGITAL HUB ADMIN MACHINES
==================================*/

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Arial,Helvetica,sans-serif;
}

:root{

    --bg:#07111F;
    --card:#102040;
    --card2:#16294F;
    --primary:#00D084;
    --blue:#19B5FE;
    --danger:#FF4D4F;
    --warning:#FFC107;

    --white:#ffffff;
    --text:#BFCBE5;
    --border:rgba(255,255,255,.06);

}

body{

    background:var(--bg);
    color:var(--white);

}

.page{

    max-width:1400px;
    margin:auto;
    padding:25px;

}

/*========================
HEADER
========================*/

.header{

    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:20px;
    margin-bottom:30px;
    flex-wrap:wrap;

}

.header h1{

    font-size:36px;
    font-weight:700;

}

.header p{

    color:var(--text);
    margin-top:6px;

}

.primaryBtn{

    background:linear-gradient(135deg,#00D084,#00E676);
    color:#04111E;
    border:none;
    padding:15px 28px;
    border-radius:14px;
    font-size:16px;
    font-weight:bold;
    cursor:pointer;
    transition:.3s;

}

.primaryBtn:hover{

    transform:translateY(-2px);

}

/*========================
STATISTICS
========================*/

.statsGrid{

    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(230px,1fr));
    gap:20px;
    margin-bottom:30px;

}

.statCard{

    background:var(--card);
    border:1px solid var(--border);
    border-radius:20px;
    padding:25px;
    transition:.3s;

}

.statCard:hover{

    transform:translateY(-5px);

}

.statCard h2{

    color:var(--primary);
    font-size:38px;
    margin-bottom:10px;

}

.statCard span{

    color:var(--text);
    font-size:15px;

}

/*========================
SEARCH
========================*/

.searchSection{

    margin:30px 0;

}

.searchSection input{

    width:100%;
    background:var(--card);
    border:1px solid var(--border);
    border-radius:16px;
    padding:18px;
    color:white;
    font-size:16px;
    outline:none;

}

.searchSection input::placeholder{

    color:#7E91B7;

}

/*========================
FORM
========================*/

.machineForm{

    display:none;
    background:var(--card);
    border-radius:24px;
    padding:30px;
    margin-bottom:40px;
    border:1px solid var(--border);

}

.machineForm h2{

    margin-bottom:25px;
    font-size:28px;

}

.grid2{

    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:18px;

}

.machineForm input,
.machineForm select{

    width:100%;
    background:var(--card2);
    border:none;
    border-radius:14px;
    padding:16px;
    color:white;
    font-size:15px;
    outline:none;
    margin-bottom:16px;

}

.machineForm input::placeholder{

    color:#8EA3C9;

}

/*========================
SECTION TITLE
========================*/

.sectionTitle{

    font-size:34px;
    font-weight:700;
    margin:35px 0 25px;

}

/*========================
MACHINE GRID
========================*/

.machineGrid{

    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(360px,1fr));
    gap:25px;

}

/*========================
MACHINE CARD
========================*/

.machineCard{

    background:var(--card);
    border:1px solid var(--border);
    border-radius:22px;
    overflow:hidden;
    transition:.35s;

}

.machineCard:hover{

    transform:translateY(-6px);
    box-shadow:0 18px 40px rgba(0,0,0,.35);

}

.machineCard img{

    width:100%;
    height:220px;
    object-fit:cover;
    display:block;
    background:#16294F;

}

.machineInfo{

    padding:24px;

}

.machineInfo h3{

    font-size:30px;
    color:var(--primary);
    margin-bottom:18px;

}

.machineInfo p{

    margin:12px 0;
    color:var(--text);
    font-size:17px;
    line-height:1.6;

}

.machineInfo strong{

    color:white;

}

/*========================
BADGES
========================*/

.badges{

    display:flex;
    gap:10px;
    flex-wrap:wrap;
    margin:20px 0;

}

.badge{

    padding:8px 18px;
    border-radius:30px;
    font-size:13px;
    font-weight:bold;

}

.activeBadge{

    background:#00D084;
    color:#04111E;

}

.disabledBadge{

    background:#FF4D4F;
    color:white;

}

.vipBadge{

    background:#FFC107;
    color:#111827;

}

/*========================
BUTTONS
========================*/

.cardButtons{

    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:12px;
    margin-top:25px;

}

.cardButtons button{

    border:none;
    border-radius:12px;
    padding:14px;
    font-size:15px;
    font-weight:700;
    cursor:pointer;
    transition:.25s;

}

.cardButtons button:hover{

    transform:translateY(-2px);

}

.editBtn{

    background:#FFC107;
    color:#111827;

}

.deleteBtn{

    background:#FF4D4F;
    color:white;

}

.enableBtn{

    background:#00D084;
    color:#04111E;

}

.disableBtn{

    background:#5C657A;
    color:white;

}

/*==========================
UPLOAD SECTION
==========================*/

.uploadSection{

    margin:25px 0;

}

.uploadBtn{

    display:flex;
    justify-content:center;
    align-items:center;
    width:100%;
    height:60px;

    background:var(--card2);

    border:2px dashed var(--blue);

    border-radius:16px;

    color:var(--blue);

    font-weight:bold;

    cursor:pointer;

    transition:.3s;

}

.uploadBtn:hover{

    background:#1A3566;

}

#previewImage{

    width:100%;

    height:240px;

    object-fit:cover;

    margin-top:20px;

    border-radius:18px;

    display:none;

    border:2px solid var(--border);

}

/*==========================
VIP
==========================*/

.vipRow{

    display:flex;

    align-items:center;

    gap:12px;

    margin:20px 0;

}

.vipRow input{

    width:20px;

    height:20px;

    accent-color:var(--primary);

}

/*==========================
FORM BUTTONS
==========================*/

.formActions{

    display:flex;

    gap:15px;

    margin-top:25px;

}

.successBtn{

    flex:1;

    background:var(--primary);

    color:#04111E;

    border:none;

    border-radius:14px;

    padding:16px;

    font-weight:bold;

    cursor:pointer;

}

.dangerBtn{

    flex:1;

    background:var(--danger);

    color:white;

    border:none;

    border-radius:14px;

    padding:16px;

    font-weight:bold;

    cursor:pointer;

}

.secondaryBtn{

    flex:1;

    background:#475569;

    color:white;

    border:none;

    border-radius:14px;

    padding:16px;

    font-weight:bold;

    cursor:pointer;

}

/*==========================
POPUPS
==========================*/

.popup{

    position:fixed;

    inset:0;

    display:none;

    justify-content:center;

    align-items:center;

    background:rgba(0,0,0,.75);

    z-index:1000;

}

.popupBox{

    width:92%;

    max-width:420px;

    background:var(--card);

    border-radius:22px;

    padding:30px;

    text-align:center;

    border:1px solid var(--border);

}

.popupIcon{

    font-size:60px;

    margin-bottom:20px;

}

.popupButtons{

    display:flex;

    gap:12px;

    margin-top:25px;

}

/*==========================
LOADING
==========================*/

.loadingOverlay{

    position:fixed;

    inset:0;

    background:rgba(7,17,31,.95);

    display:none;

    justify-content:center;

    align-items:center;

    flex-direction:column;

    z-index:2000;

}

.loader{

    width:60px;

    height:60px;

    border:6px solid rgba(255,255,255,.15);

    border-top:6px solid var(--primary);

    border-radius:50%;

    animation:spin 1s linear infinite;

}

.loadingOverlay p{

    margin-top:20px;

    font-size:18px;

}

@keyframes spin{

    to{

        transform:rotate(360deg);

    }

}

/*==========================
RESPONSIVE
==========================*/

@media(max-width:900px){

.grid2{

grid-template-columns:1fr;

}

.machineGrid{

grid-template-columns:1fr;

}

.statsGrid{

grid-template-columns:repeat(2,1fr);

}

}

@media(max-width:600px){

.page{

padding:15px;

}

.header{

flex-direction:column;

align-items:flex-start;

}

.header h1{

font-size:28px;

}

.statsGrid{

grid-template-columns:1fr;

}

.formActions{

flex-direction:column;

}

.popupButtons{

flex-direction:column;

}

.cardButtons{

grid-template-columns:1fr;

}

.machineCard img{

height:200px;

}

}
