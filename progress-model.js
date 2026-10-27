(function(root){
'use strict';
const stamp=v=>Number.isFinite(v)&&v>=0?v:0;
function eventId(a){const text=JSON.stringify([a.id,a.time,a.selected,a.correct,a.seconds,a.mode,a.numeric]);let x=2166136261,y=2246822519;for(let i=0;i<text.length;i++){x=Math.imul(x^text.charCodeAt(i),16777619);y=Math.imul(y^text.charCodeAt(i),3266489917)}return 'a-'+(x>>>0).toString(16)+'-'+(y>>>0).toString(16)}
function normalize(value={}){
 const attempts=new Map,views=new Map,focus=new Map;
 for(const a of Array.isArray(value.attempts)?value.attempts:[]){if(!a||typeof a.id!=='string'||typeof a.correct!=='boolean'||!Number.isInteger(a.selected)||a.selected<0||a.selected>3)continue;const clean={id:a.id,correct:a.correct,selected:a.selected,time:stamp(a.time),seconds:stamp(a.seconds),mode:typeof a.mode==='string'?a.mode:'practice'};if(Number.isFinite(a.numeric))clean.numeric=a.numeric;clean.eventId=eventId(clean);attempts.set(clean.eventId,clean)}
 for(const a of Array.isArray(value.presented)?value.presented:[]){if(a&&typeof a.id==='string'&&Number.isFinite(a.time)&&a.time>=0&&(!views.has(a.id)||views.get(a.id).time<a.time))views.set(a.id,{id:a.id,time:a.time})}
 for(const f of Array.isArray(value.focusEvents)?value.focusEvents:[]){if(f&&typeof f.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(f.id)&&Number.isFinite(f.minutes)&&f.minutes>0&&f.minutes<=1440)focus.set(f.id,{id:f.id,minutes:f.minutes,time:stamp(f.time)})}
 const focusEvents=[...focus.values()];const base=Number.isFinite(value.focusBase)?stamp(value.focusBase):Math.max(0,stamp(value.focus)-focusEvents.reduce((n,f)=>n+f.minutes,0));
 return {attempts:[...attempts.values()].sort((a,b)=>a.time-b.time||a.eventId.localeCompare(b.eventId)),presented:[...views.values()].sort((a,b)=>a.time-b.time),notes:typeof value.notes==='string'?value.notes.slice(0,100000):'',notesUpdatedAt:stamp(value.notesUpdatedAt),focusBase:base,focusEvents,focus:base+focusEvents.reduce((n,f)=>n+f.minutes,0)};
}
function merge(left,right){const a=normalize(left),b=normalize(right);const newer=b.notesUpdatedAt>a.notesUpdatedAt||(b.notesUpdatedAt===a.notesUpdatedAt&&b.notes>a.notes);return normalize({attempts:[...a.attempts,...b.attempts],presented:[...a.presented,...b.presented],notes:newer?b.notes:a.notes,notesUpdatedAt:Math.max(a.notesUpdatedAt,b.notesUpdatedAt),focusBase:Math.max(a.focusBase,b.focusBase),focusEvents:[...a.focusEvents,...b.focusEvents]})}
function metadata(s){s=normalize(s);return {version:1,notes:s.notes,notesUpdatedAt:s.notesUpdatedAt,focusBase:s.focusBase}}
root.LedgerProgress={normalize,merge,eventId,metadata};
if(typeof module!=='undefined')module.exports=root.LedgerProgress;
})(typeof globalThis!=='undefined'?globalThis:window);
