/* MDH shared navigation. Add <link rel="stylesheet" href="assets/css/mdh-navigation.css"> and this script to any user page. */
(function(){
  if(document.querySelector('.mdh-bottom-nav')) return;
  const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const items=[
    ['dashboard.html','⌂','Home'],
    ['machines.html','◈','Machines'],
    ['deposit.html','＋','Deposit'],
    ['support.html','♡','Support'],
    ['profile.html','◎','Profile']
  ];
  const nav=document.createElement('nav');
  nav.className='mdh-bottom-nav';
  nav.setAttribute('aria-label','MDH main navigation');
  items.forEach(([href,icon,label])=>{
    const a=document.createElement('a');
    a.className='mdh-nav-item'+(path===href?' active':'');
    a.href=href;
    a.innerHTML='<span class="mdh-nav-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span>';
    nav.appendChild(a);
  });
  document.body.appendChild(nav);
})();
