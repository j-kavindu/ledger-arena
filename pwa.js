'use strict';
(()=>{
 const install=document.querySelector('#installApp'),help=document.querySelector('#installHelp'),status=document.querySelector('#offlineStatus');let deferred,registration;
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 function connection(){status.textContent=navigator.onLine?'Practice ready offline. Sign in to sync when connected.':'You’re offline. Keep practising; signed-in progress syncs after reconnecting.'}
 if(standalone())install.hidden=true;
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;if(!standalone())install.hidden=false});
 window.addEventListener('appinstalled',()=>{deferred=null;install.hidden=true;status.textContent='Ledger Arena is installed.'});
 install.onclick=async()=>{if(deferred){const prompt=deferred;deferred=null;await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome!=='accepted')install.hidden=false}else help.showModal()};
 document.querySelector('#closeInstallHelp').onclick=()=>help.close();
 help.addEventListener('click',event=>{if(event.target===help)help.close()});
 window.addEventListener('online',()=>{if(registration)connection()});window.addEventListener('offline',()=>{if(registration)connection()});
 if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(async reg=>{registration=reg;await navigator.serviceWorker.ready;connection();
   function offerUpdate(){if(!reg.waiting)return;const button=document.createElement('button');button.className='account-button';button.textContent='Update app';button.onclick=()=>{button.disabled=true;navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});reg.waiting.postMessage('APPLY_UPDATE')};status.replaceChildren(document.createTextNode('An update is ready. Finish your session, then '),button)}
   offerUpdate();reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',()=>{if(reg.waiting&&navigator.serviceWorker.controller)offerUpdate()})});
  }).catch(()=>{status.textContent='Browser practice is available. Offline installation could not be prepared; try reloading online.'});
 }
})();
