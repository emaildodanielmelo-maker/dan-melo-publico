/* Navegação por abas: cada tema é um painel exclusivo, com URL compartilhável. */
(() => {
  'use strict';
  const labels={panorama:'Panorama do Brasil',explorador:'Mapa e ranking por UF',regioes:'Análise regional',historico:'Histórico e tendências',comparar:'Comparação de estados',simulacoes:'Simulações e alertas',metodologia:'Fontes e metodologia'};
  const tabs=Array.from(document.querySelectorAll('[data-atlas-tab]'));
  const views={panorama:[document.querySelector('.hero'),document.getElementById('panorama')]};
  for(const id of Object.keys(labels))if(id!=='panorama')views[id]=[document.getElementById(id)];
  function route(hash){const id=String(hash||'').replace(/^#/,'');return id==='inicio'?'panorama':id in labels?id:'panorama';}
  function activate(id,updateUrl=true){
    id=route(id);
    for(const [key,els] of Object.entries(views))for(const el of els){if(!el)continue;el.classList.toggle('atlas-tab-hidden',key!==id);el.setAttribute('aria-hidden',String(key!==id));}
    for(const tab of tabs){const active=tab.dataset.atlasTab===id;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
    document.getElementById('atlas-current-view').textContent=labels[id];
    if(updateUrl)history.replaceState(null,'','#'+id);
    window.scrollTo({top:0,behavior:'instant'});
  }
  window.atlasSelectTab=activate;
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href^="#"]');
    if(!link)return;
    const id=link.getAttribute('href').slice(1);
    if(!(id in labels)&&id!=='inicio')return;
    e.preventDefault();activate(id);
  });
  const first=route(location.hash);
  activate(first,false);
  window.addEventListener('hashchange',()=>activate(route(location.hash),false));
  tabs.forEach((tab,i)=>tab.addEventListener('keydown',e=>{
    if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
    e.preventDefault();
    const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    activate(tabs[next].dataset.atlasTab);tabs[next].focus();
  }));
})();
