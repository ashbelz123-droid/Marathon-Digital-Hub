console.log("Dashboard Loaded");

setInterval(() => {
document.querySelector(".logo").style.boxShadow =
`0 0 ${20 + Math.random()*30}px #00bfff`;
},1000);
