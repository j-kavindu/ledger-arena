(function(){
 'use strict';
 const key='ledger-arena-theme',root=document.documentElement;
 const system=typeof matchMedia==='function'?matchMedia('(prefers-color-scheme: dark)'):null;
 let chosen=null;try{const value=localStorage.getItem(key);if(value==='light'||value==='dark')chosen=value}catch{}
 function apply(theme){
  const dark=theme==='dark';root.dataset.theme=dark?'dark':'light';root.style.colorScheme=dark?'dark':'light';
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#101a18':'#17694f';
  const button=document.querySelector('#themeToggle');if(button){button.setAttribute('aria-pressed',String(dark));button.title=dark?'Switch to light mode':'Switch to dark mode';}
  const icon=document.querySelector('#themeIcon');if(icon)icon.textContent=dark?'☀':'☾';
 }
 apply(chosen||(system?.matches?'dark':'light'));
 function init(){apply(chosen||(system?.matches?'dark':'light'));const button=document.querySelector('#themeToggle');if(button)button.addEventListener('click',()=>{chosen=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(key,chosen)}catch{}apply(chosen)})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 const systemChanged=event=>{if(!chosen)apply(event.matches?'dark':'light')};
 if(system?.addEventListener)system.addEventListener('change',systemChanged);
 window.addEventListener('storage',event=>{if(event.key!==key)return;chosen=event.newValue==='light'||event.newValue==='dark'?event.newValue:null;apply(chosen||(system?.matches?'dark':'light'))});
})();
