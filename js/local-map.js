/* Skjematisk Østensjø-kart. Koordinatene er spillkoordinater, ikke kartdata. */
(function () {
  'use strict';
  const panel = document.getElementById('map-panel');
  const toolbar = document.querySelector('.map-toolbar');
  const layer = document.createElement('section');
  layer.className = 'local-map'; layer.setAttribute('aria-label', 'Stilisert spillkart over Østensjø');
  const areas = [
    {id:'bryn',name:'Bryn',x:295,y:130,description:'Nordlig inngang til postområdet.'},
    {id:'hoyenhall',name:'Høyenhall',x:190,y:245,description:'Boliggatene vest for vannet.'},
    {id:'manglerud',name:'Manglerud',x:180,y:395,description:'Et nabolag med plass til mange leveringsstopp.'},
    {id:'oppsal',name:'Oppsal',x:635,y:225,description:'Et større boligområde nordøst i bydelen.'},
    {id:'godlia',name:'Godlia',x:490,y:120,description:'Rolige gater mellom Bryn og Oppsal.'},
    {id:'abildso',name:'Abildsø',x:260,y:595,description:'Boligområder sørvest for Østensjøvannet.'},
    {id:'boler',name:'Bøler',x:645,y:455,description:'Et knutepunkt mellom boliggatene og marka.'},
    {id:'bogerud',name:'Bogerud',x:605,y:635,description:'Her skal den første postrunden begynne.'},
    {id:'skullerud',name:'Skullerud',x:640,y:790,description:'Sørlig del av kartet, ved inngangen til marka.'}
  ];
  const roads = [
    'M295 130 Q245 180 190 245 L180 395 Q195 490 260 595 Q360 665 605 635 L640 790',
    'M295 130 L490 120 Q570 155 635 225 Q690 335 645 455 L605 635',
    'M190 245 Q305 210 390 230 M180 395 L335 400 M260 595 L360 550',
    'M635 225 L535 310 M645 455 Q565 425 505 450 M605 635 L515 575'
  ];
  const label = (text,x,y,cls) => '<text class="'+cls+'" x="'+x+'" y="'+y+'">'+text+'</text>';
  const houses = areas.map(a => Array.from({length:8},(_,i) => {
    const x=a.x+(i%4-1.5)*24, y=a.y+(i<4?-57:41);
    return '<g class="local-house" transform="translate('+x+' '+y+')"><rect x="-7" y="-5" width="14" height="12" rx="2"/><path d="M-10-5 L0-13 L10-5Z"/><rect class="window" x="-2" y="0" width="4" height="4"/></g>';
  }).join('')).join('');
  layer.innerHTML = '<svg viewBox="0 0 900 900" aria-label="Skjematisk Østensjø med boligområder, vann og veier">'+
    '<defs><pattern id="local-grass" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M8 18l2-4 2 4 M25 30l2-4 2 4" stroke="#9bb393" stroke-width="1" fill="none" opacity=".35"/></pattern><pattern id="local-trees" width="48" height="52" patternUnits="userSpaceOnUse"><path d="M15 7l-9 19h18Z M35 28l-8 17h16Z" fill="#698d6d" opacity=".5"/></pattern></defs>'+
    '<rect width="900" height="900" fill="#e1e4cb"/><rect width="900" height="900" fill="url(#local-grass)"/>'+
    '<path d="M740 0 Q670 150 730 300 Q710 450 750 600 L700 900 H900 V0Z" fill="#adc59d"/><path d="M740 0 Q670 150 730 300 Q710 450 750 600 L700 900 H900 V0Z" fill="url(#local-trees)"/>'+
    '<path d="M368 175 Q455 145 510 240 Q545 345 495 480 Q460 570 360 590 Q305 490 320 380 Q350 290 368 175Z" fill="#b9cd9f"/>'+
    '<path d="M403 211 Q452 185 476 258 Q503 320 465 388 Q450 420 465 456 Q450 503 385 537 Q358 490 371 427 Q350 381 380 322 Q400 274 403 211Z" fill="#8ebcc0" stroke="#6fa4a7" stroke-width="3"/>'+
    '<path d="M415 244 Q450 224 456 270 M399 460 Q405 490 390 509" fill="none" stroke="#c2dfe0" stroke-width="3"/>'+
    '<path d="M380 185 Q310 320 335 450 Q335 560 385 575 Q540 500 515 350 Q555 230 480 180" class="local-trail"/>'+
    roads.map(d=>'<path d="'+d+'" class="local-road-edge"/><path d="'+d+'" class="local-road"/>').join('')+houses+
    label('ØSTMARKA',805,405,'local-nature')+label('Østensjøvannet',422,358,'local-water')+
    areas.map(a=>'<g class="local-area" data-area="'+a.id+'" role="button" tabindex="0" aria-label="Velg '+a.name+'"><circle cx="'+a.x+'" cy="'+a.y+'" r="24" class="local-hit"/><circle cx="'+a.x+'" cy="'+a.y+'" r="9" class="local-marker"/>'+label(a.name,a.x,a.y+27,'local-label')+'</g>').join('')+
    '<g class="local-start" transform="translate(550 594)"><rect width="103" height="23" rx="11"/>'+label('STARTOMRÅDE',51,15,'local-start-label')+'</g></svg>'+
    '<div class="local-map-note">SKJEMATISK KART · FØRSTE UTKAST</div>'+
    '<div class="local-info" role="status" aria-live="polite"></div>'+
    '<div class="local-controls"><button type="button" data-local="out" aria-label="Zoom ut i lokalkart">−</button><button type="button" data-local="in" aria-label="Zoom inn i lokalkart">+</button><button type="button" data-local="home" aria-label="Vis hele Østensjø">⌂</button></div>';
  panel.append(layer);
  const tabs=document.createElement('div'); tabs.className='map-mode-tabs';
  tabs.innerHTML='<button type="button" data-map-mode="local" aria-pressed="true">Østensjø</button><button type="button" data-map-mode="world" aria-pressed="false">Verden</button>';
  toolbar.before(tabs);
  let local=true, selected='bogerud', zoom=1, cx=450, cy=450, moved=false;
  const svg=layer.querySelector('svg'), pointers=new Map(); let gesture=null;
  function dimensions(){const r=svg.getBoundingClientRect();const unit=900/zoom/Math.max(1,Math.min(r.width,r.height));return {r,unit,w:r.width*unit,h:r.height*unit};}
  function draw(){const d=dimensions();cx=d.w>=900?450:Math.max(d.w/2,Math.min(900-d.w/2,cx));cy=d.h>=900?450:Math.max(d.h/2,Math.min(900-d.h/2,cy));svg.setAttribute('viewBox',[cx-d.w/2,cy-d.h/2,d.w,d.h].join(' '));}
  function choose(id){selected=id;const a=areas.find(a=>a.id===id);layer.querySelectorAll('[data-area]').forEach(el=>el.classList.toggle('selected',el.dataset.area===id));layer.querySelector('.local-info').innerHTML='<strong>'+a.name+'</strong><span>'+a.description+'</span>';}
  function mode(value){local=value==='local';panel.classList.toggle('local-mode',local);layer.hidden=!local;toolbar.querySelector('h1').textContent=local?'Din første postrunde':'Postens verden';toolbar.querySelector('.eyebrow').textContent=local?'KAPITTEL 1 · ØSTENSJØ':'NORGE · 1850';tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapMode===value)));if(local)draw();}
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-map-mode]');if(b)mode(b.dataset.mapMode);});
  layer.querySelectorAll('[data-area]').forEach(el=>{el.addEventListener('click',()=>{if(!moved)choose(el.dataset.area);});el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(el.dataset.area);}});});
  layer.querySelectorAll('[data-local]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.local==='home'){zoom=1;cx=cy=450;}else zoom=Math.max(1,Math.min(4,zoom*(b.dataset.local==='in'?1.3:1/1.3)));draw();}));
  function begin(){const p=[...pointers.values()];gesture={points:p.map(v=>({...v})),cx,cy,zoom,unit:dimensions().unit};}
  svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId);if(pointers.size===1)moved=false;begin();});
  svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...pointers.values()],s=gesture.points;const x=p.reduce((v,a)=>v+a.x,0)/p.length,y=p.reduce((v,a)=>v+a.y,0)/p.length,sx=s.reduce((v,a)=>v+a.x,0)/s.length,sy=s.reduce((v,a)=>v+a.y,0)/s.length;if(Math.hypot(x-sx,y-sy)>4)moved=true;if(p.length===2&&s.length===2){const dist=Math.hypot(s[1].x-s[0].x,s[1].y-s[0].y);if(dist>0)zoom=Math.max(1,Math.min(4,gesture.zoom*Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)/dist));moved=true;}cx=gesture.cx-(x-sx)*gesture.unit;cy=gesture.cy-(y-sy)*gesture.unit;draw();});
  function end(e){pointers.delete(e.pointerId);if(pointers.size)begin();else gesture=null;}
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('lostpointercapture',end);
  // Hit-test etter pointer capture slik at et trykk velger området under fingeren.
  svg.addEventListener('click',e=>{if(moved)return;const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-area]');if(el)choose(el.dataset.area);});
  svg.addEventListener('wheel',e=>{e.preventDefault();const d=dimensions(),x=e.clientX-d.r.left-d.r.width/2,y=e.clientY-d.r.top-d.r.height/2;const wx=cx+x*d.unit,wy=cy+y*d.unit;zoom=Math.max(1,Math.min(4,zoom*Math.exp(-e.deltaY*.0015)));const next=dimensions();cx=wx-x*next.unit;cy=wy-y*next.unit;draw();},{passive:false});
  new ResizeObserver(()=>{if(local)draw();}).observe(layer);
  choose(selected);mode('local');
})();
