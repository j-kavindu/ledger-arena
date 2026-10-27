(function(root){
'use strict';
function createCloudSync({sdk,db,uid,getState,apply,status,delay=900}){
 let active=true,ready=false,timer,running=false,dirty=false;const unsub=[],waiters=[];const remote={attempts:new Map,presented:new Map,focusEvents:new Map,meta:{}};const loaded=new Set;
 const doc=(collection,id)=>sdk.doc(db,'users',uid,collection,id);
 function joined(){return {...remote.meta,attempts:[...remote.attempts.values()],presented:[...remote.presented.values()],focusEvents:[...remote.focusEvents.values()]}}
 function receive(name,snapshot){if(!active)return;if(name==='meta')remote.meta=snapshot.exists()?snapshot.data():{};else remote[name]=new Map(snapshot.docs.map(d=>[d.id,d.data()]));loaded.add(name);if(loaded.size===4){ready=true;apply(joined(),uid);queue()}}
 function queue(){if(!active)return;dirty=true;clearTimeout(timer);timer=setTimeout(flush,delay)}
 async function limited(tasks){for(let i=0;i<tasks.length;i+=10){if(!active)return;await Promise.all(tasks.slice(i,i+10).map(f=>f()))}}
 async function flush(){if(!active||!ready)return;if(running)return new Promise(resolve=>waiters.push(resolve));running=true;dirty=false;status('Syncing progress…');
  try{
   const state=root.LedgerProgress.normalize(getState());const tasks=[];
   for(const a of state.attempts)if(!remote.attempts.has(a.eventId))tasks.push(()=>sdk.setDoc(doc('attempts',a.eventId),a));
   for(const f of state.focusEvents)if(!remote.focusEvents.has(f.id))tasks.push(()=>sdk.setDoc(doc('focusEvents',f.id),f));
   for(const v of state.presented)if((remote.presented.get(v.id)?.time??-1)<v.time)tasks.push(()=>sdk.runTransaction(db,async t=>{const ref=doc('presented',v.id),snap=await t.get(ref);if(!snap.exists()||snap.data().time<v.time)t.set(ref,v)}));
   await limited(tasks);if(!active)return;
   const meta=root.LedgerProgress.metadata(state);const current=root.LedgerProgress.metadata(remote.meta);
   if(meta.focusBase>current.focusBase||meta.notesUpdatedAt>current.notesUpdatedAt||(meta.notesUpdatedAt===current.notesUpdatedAt&&meta.notes>current.notes))await sdk.runTransaction(db,async t=>{const ref=doc('state','meta'),snap=await t.get(ref);const result=root.LedgerProgress.metadata(root.LedgerProgress.merge(snap.exists()?snap.data():{},meta));t.set(ref,result)});
   if(active)status('Progress synced across devices.');
  }catch(error){if(active)status(error?.code==='permission-denied'?'Cloud sync is unavailable. Your progress is safe on this device.':'Saved on this device. Sync will retry when connected.');}
  finally{running=false;waiters.splice(0).forEach(resolve=>resolve());if(active&&dirty)queue()}
 }
 for(const name of ['attempts','presented','focusEvents'])unsub.push(sdk.onSnapshot(sdk.collection(db,'users',uid,name),s=>receive(name,s),()=>status('Cloud sync is unavailable. Your progress is safe on this device.')));
 unsub.push(sdk.onSnapshot(doc('state','meta'),s=>receive('meta',s),()=>status('Cloud sync is unavailable. Your progress is safe on this device.')));
 const online=()=>queue();root.addEventListener?.('online',online);
 return {queue,flush,stop(){active=false;clearTimeout(timer);unsub.forEach(fn=>fn());root.removeEventListener?.('online',online)}};
}
root.LedgerCloud={create:createCloudSync};if(typeof module!=='undefined')module.exports=root.LedgerCloud;
})(typeof globalThis!=='undefined'?globalThis:window);
