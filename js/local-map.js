/* Illustrert kartutkast. Treffområder følger bildet, ikke oppmålte koordinater. */
(function () {
  'use strict';
  const panel = document.getElementById('map-panel');
  const toolbar = document.querySelector('.map-toolbar');
  const layer = document.createElement('section');
  layer.className = 'local-map'; layer.setAttribute('aria-label', 'Stilisert spillkart over Østensjø');
  const WIDTH=1096, HEIGHT=1435;
  const areas = [
    {id:'bryn',name:'Bryn',x:270,y:255,description:'Gårdstunet ved den nordlige inngangen til kartet.'},
    {id:'hellerud',name:'Hellerud',x:644,y:132,description:'Gårdstun nord i kartområdet.'},
    {id:'trasopp',name:'Trasopp',x:586,y:350,description:'Et gårdstun ved skogkanten.'},
    {id:'oppsal',name:'Oppsal',x:521,y:497,description:'Gårdstunet nordøst for Østensjøvannet.'},
    {id:'abildso',name:'Abildsø',x:124,y:699,description:'Gårdstunet vest for Østensjøvannet.'},
    {id:'ostensjo',name:'Østensjø',x:448,y:707,description:'Gårdstunet på østsiden av vannet.'},
    {id:'ulsrud',name:'Ulsrud',x:659,y:767,description:'Gårdstunet mellom jordene og skogen.'},
    {id:'boler',name:'Bøler',x:495,y:920,description:'Gårdstunet vest for Nøklevann.'},
    {id:'bogerud',name:'Bogerud',x:279,y:1043,description:'Her skal den første postrunden begynne.'},
    {id:'rustadsaga',name:'Rustadsaga',x:538,y:1131,description:'Sagbruket ved bekken sørvest for Nøklevann.'},
    {id:'rustad',name:'Rustad',x:619,y:1186,description:'Gårdstunet ved den sørlige delen av kartet.'},
    {id:'skullerud',name:'Skullerud',x:548,y:1310,description:'Gårdstunet lengst sør på kartet.'},
    {id:'sarabraten',name:'Sarabråten',x:988,y:724,description:'Gårdstunet ved Nøklevanns nordøstlige side.'}
  ];
  layer.innerHTML = '<svg viewBox="0 0 1096 1435" aria-label="Illustrert kart over Østensjø og Østmarka med klikkbare gårder">'+
    '<image href="assets/ostensjo-1850.webp" x="0" y="0" width="1096" height="1435" preserveAspectRatio="none" />'+
    areas.map(a=>'<g class="local-area farm-hotspot" data-area="'+a.id+'" role="button" tabindex="0" aria-label="Velg '+a.name+'"><title>'+a.name+'</title><ellipse class="farm-ring" cx="'+a.x+'" cy="'+a.y+'" rx="64" ry="36"/><ellipse class="farm-hit" cx="'+a.x+'" cy="'+a.y+'" rx="72" ry="45"/></g>').join('')+'</svg>'+
    '<div class="local-map-note">ILLUSTRERT KARTUTKAST</div>'+
    '<div class="local-info" role="status" aria-live="polite"></div>'+
    '<div class="local-controls"><button type="button" data-local="out" aria-label="Zoom ut i lokalkart">−</button><button type="button" data-local="in" aria-label="Zoom inn i lokalkart">+</button><button type="button" data-local="home" aria-label="Vis hele kartet">⌂</button></div>';
  panel.append(layer);
  const tabs=document.createElement('div'); tabs.className='map-mode-tabs';
  tabs.innerHTML='<button type="button" data-map-mode="local" aria-pressed="true">Østensjø</button><button type="button" data-map-mode="world" aria-pressed="false">Verden</button>';
  toolbar.before(tabs);
  let local=true, selected='bogerud', zoom=1, cx=WIDTH/2, cy=HEIGHT/2, moved=false;
  const svg=layer.querySelector('svg'), pointers=new Map(); let gesture=null;
  function dimensions(){const r=svg.getBoundingClientRect();const unit=Math.max(WIDTH/Math.max(1,r.width),HEIGHT/Math.max(1,r.height))/zoom;return {r,unit,w:r.width*unit,h:r.height*unit};}
  function draw(){const d=dimensions();cx=d.w>=WIDTH?WIDTH/2:Math.max(d.w/2,Math.min(WIDTH-d.w/2,cx));cy=d.h>=HEIGHT?HEIGHT/2:Math.max(d.h/2,Math.min(HEIGHT-d.h/2,cy));svg.setAttribute('viewBox',[cx-d.w/2,cy-d.h/2,d.w,d.h].join(' '));}
  function choose(id){selected=id;const a=areas.find(a=>a.id===id);layer.querySelectorAll('[data-area]').forEach(el=>el.classList.toggle('selected',el.dataset.area===id));layer.querySelector('.local-info').innerHTML='<strong>'+a.name+'</strong><span>'+a.description+'</span>';}
  function mode(value){local=value==='local';panel.classList.toggle('local-mode',local);layer.hidden=!local;toolbar.querySelector('h1').textContent=local?'Din første postrunde':'Postens verden';toolbar.querySelector('.eyebrow').textContent=local?'KAPITTEL 1 · ØSTENSJØ':'NORGE · 1850';tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapMode===value)));if(local)draw();}
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-map-mode]');if(b)mode(b.dataset.mapMode);});
  layer.querySelectorAll('[data-area]').forEach(el=>{el.addEventListener('click',()=>{if(!moved)choose(el.dataset.area);});el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(el.dataset.area);}});});
  layer.querySelectorAll('[data-local]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.local==='home'){zoom=1;cx=WIDTH/2;cy=HEIGHT/2;}else zoom=Math.max(1,Math.min(6,zoom*(b.dataset.local==='in'?1.3:1/1.3)));draw();}));
  function begin(){const p=[...pointers.values()];gesture={points:p.map(v=>({...v})),cx,cy,zoom,unit:dimensions().unit};}
  svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId);if(pointers.size===1)moved=false;begin();});
  svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...pointers.values()],s=gesture.points;const x=p.reduce((v,a)=>v+a.x,0)/p.length,y=p.reduce((v,a)=>v+a.y,0)/p.length,sx=s.reduce((v,a)=>v+a.x,0)/s.length,sy=s.reduce((v,a)=>v+a.y,0)/s.length;if(Math.hypot(x-sx,y-sy)>4)moved=true;if(p.length===2&&s.length===2){const dist=Math.hypot(s[1].x-s[0].x,s[1].y-s[0].y);if(dist>0)zoom=Math.max(1,Math.min(4,gesture.zoom*Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)/dist));moved=true;}cx=gesture.cx-(x-sx)*gesture.unit;cy=gesture.cy-(y-sy)*gesture.unit;draw();});
  function end(e){if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if(pointers.size)begin();else gesture=null;}
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('lostpointercapture',end);
  // Hit-test etter pointer capture slik at et trykk velger området under fingeren.
  svg.addEventListener('click',e=>{if(moved)return;const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-area]');if(el)choose(el.dataset.area);});
  svg.addEventListener('wheel',e=>{e.preventDefault();const d=dimensions(),x=e.clientX-d.r.left-d.r.width/2,y=e.clientY-d.r.top-d.r.height/2;const wx=cx+x*d.unit,wy=cy+y*d.unit;zoom=Math.max(1,Math.min(4,zoom*Math.exp(-e.deltaY*.0015)));const next=dimensions();cx=wx-x*next.unit;cy=wy-y*next.unit;draw();},{passive:false});
  new ResizeObserver(()=>{if(local)draw();}).observe(layer);
  svg.addEventListener('keydown',e=>{const el=e.target.closest('[data-area]');if(!el)return;const a=areas.find(a=>a.id===el.dataset.area);if(e.key==='Enter'||e.key===' '){cx=a.x;cy=a.y;zoom=Math.max(zoom,2);draw();}});
  choose(selected);mode('local');
})();
