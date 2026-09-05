import * as T from 'three';
import './style.css';
import {makeVoyager} from './spacecraft.js';
import {liveJulianDate, chartWindow, advancePlayback} from './playback.js';
import {AU,DAY,toJD,fromJD,stateAt} from './ephemeris.js';
const $=s=>document.querySelector(s);
const bodies=[['mercury',2439.7,0xaaa49c],['venus',6051.8,0xd7b782],['earth',6371,0x567dae],['mars',3389.5,0xb87850],['jupiter',69911,0xc5ae93],['saturn',58232,0xcabb94],['uranus',25362,0x8ecbd2],['neptune',24622,0x477acf]];
const events={launch:['1977-09-06T00:00:00Z','01','DEPARTURE FROM EARTH','A small beginning.','earth'],jupiter:['1979-03-05T10:00:00Z','02','THE JUPITER ENCOUNTER','A little help from gravity.','jupiter'],saturn:['1980-11-12T23:00:00Z','03','THE SATURN ENCOUNTER','A turn toward the unknown.','saturn'],portrait:['1990-02-14T00:00:00Z','04','THE FAMILY PORTRAIT','Everything we have ever known.','earth'],interstellar:['2012-08-25T00:00:00Z','05','INTERSTELLAR SPACE','Beyond the solar wind.','sun'],today:['2026-09-05T00:00:00Z','06','THE JOURNEY CONTINUES','Still carrying our story.','sun']};
let data={},jd=toJD(events.jupiter[0]),minJD,maxJD,live=false,detailed=false,playing=true,rate=3600,view='ride',target='jupiter',yaw=0,pitch=0,zoom=55,orbitDistance=19,mapDistance=1500,labels=true,trueScale=true,lastStamp=0,lastUI=0;
let renderer;
try{renderer=new T.WebGLRenderer({canvas:$('#universe'),antialias:true,logarithmicDepthBuffer:true});}catch(e){$('#loading-message').textContent='This experience requires WebGL. Enable hardware acceleration and reload.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x070a0e);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,.01,1e10);
const spacecraft=makeVoyager();scene.add(spacecraft);const ambient=new T.AmbientLight(0xc3d4eb,.55);scene.add(ambient);const sunlight=new T.DirectionalLight(0xffe6c7,3);scene.add(sunlight);
const V=a=>new T.Vector3(a[0],a[2],-a[1]);
let seed=43;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const starPositions=[],starColors=[];for(let i=0;i<6500;i++){const a=rand()*Math.PI*2,z=rand()*2-1,r=Math.sqrt(1-z*z);starPositions.push(Math.cos(a)*r*1e8,z*1e8,Math.sin(a)*r*1e8);const c=.25+rand()*.65;starColors.push(c*.9,c*.95,c);}
const starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.Float32BufferAttribute(starPositions,3));starGeo.setAttribute('color',new T.Float32BufferAttribute(starColors,3));const stars=new T.Points(starGeo,new T.PointsMaterial({size:1.35,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.85,depthWrite:false}));scene.add(stars);
function texture(name,color){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d'),base=new T.Color(color);const im=c.createImageData(1024,512);
 for(let y=0;y<512;y++)for(let x=0;x<1024;x++){const u=x/1024*Math.PI*2,v=y/512*Math.PI;let f=.9;let rr=base.r,gg=base.g,bb=base.b;
 if(name==='jupiter'||name==='saturn'){const warp=Math.sin(u*7+Math.sin(v*19))*1.8;f=.83+.12*Math.sin(v*37+warp)+.055*Math.sin(v*94+Math.sin(u*12))+.025*Math.sin(u*50+v*80);if(name==='jupiter'){const dx=(x-740)/64,dy=(y-307)/19;if(dx*dx+dy*dy<1){rr=.59;gg=.24;bb=.13;f=.9+.13*Math.sin(Math.sqrt(dx*dx+dy*dy)*24);}}}
 else if(name==='earth'){const land=Math.sin(u*3+Math.sin(v*5))*Math.cos(v*7)+.5*Math.sin(u*7-v*9)+.2*Math.sin(u*17+v*13);if(land>.4){rr=.18;gg=.28;bb=.16;}else{rr=.045;gg=.15;bb=.3;}const cloud=Math.sin(u*17+v*31+Math.sin(u*5)*3)*Math.cos(u*9-v*24);if(cloud>.55||y<20||y>492){rr=.7;gg=.74;bb=.76;}f=.9;}
 else{f=.8+.09*Math.sin(u*8+v*12)*Math.sin(v*15-u*13)+.05*Math.sin(u*31+Math.sin(v*12));}
 const n=(rand()-.5)*.04;const i=(y*1024+x)*4;im.data[i]=Math.min(255,(rr*f+n)*255);im.data[i+1]=Math.min(255,(gg*f+n)*255);im.data[i+2]=Math.min(255,(bb*f+n)*255);im.data[i+3]=255;}
 c.putImageData(im,0,0);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;return tex;}
const textureLoader=new T.TextureLoader();
const planetMeshes={};for(const [name,radius,color] of bodies){const mat=new T.MeshStandardMaterial({map:texture(name,color),roughness:1});const mesh=new T.Mesh(new T.SphereGeometry(1,80,48),mat);scene.add(mesh);planetMeshes[name]=mesh;const textureName=name==='earth'?'earth_daymap':name==='venus'?'venus_atmosphere':name;textureLoader.load(`${import.meta.env.BASE_URL}textures/${textureName}.jpg`,tex=>{tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();mat.map.dispose();mat.map=tex;mat.needsUpdate=true;},undefined,()=>console.warn('Using illustrative fallback texture for '+name));const label=document.createElement('div');label.className='body-label';label.id='label-'+name;const caption=document.createElement('span');caption.textContent=name.toUpperCase();label.append(caption);$('#body-labels').append(label);}
// Ring geometry is in the x/y plane; tilt the ring system relative to ecliptic.
const saturn=planetMeshes.saturn;const ringGroup=new T.Group();ringGroup.rotation.x=Math.PI/2-.466;const rings=[];for(let i=0;i<90;i++){const inner=1.22+i*.012;if(inner>1.94&&inner<2.02)continue;const ring=new T.Mesh(new T.RingGeometry(inner,inner+.011,128),new T.MeshStandardMaterial({color:i%4===0?0x817564:0xc1b296,side:T.DoubleSide,transparent:true,opacity:.35+rand()*.45,roughness:1}));ringGroup.add(ring);rings.push(ring);}saturn.add(ringGroup);
const sun=new T.Mesh(new T.SphereGeometry(1,48,32),new T.MeshBasicMaterial({color:new T.Color(4,3,1.8),toneMapped:false}));scene.add(sun);
const sunLabel=document.createElement('div');sunLabel.className='body-label';sunLabel.id='label-sun';sunLabel.innerHTML='<span>SUN</span>';$('#body-labels').append(sunLabel);
// Additive optical glare around the physically sized solar disk.
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=256;
const glowContext=glowCanvas.getContext('2d');
const halo=glowContext.createRadialGradient(128,128,0,128,128,128);
for(const [stop,color] of [[0,'rgba(255,250,222,1)'],[.035,'rgba(255,245,207,.95)'],[.12,'rgba(255,216,143,.55)'],[.32,'rgba(255,170,71,.16)'],[.65,'rgba(255,150,46,.035)'],[1,'rgba(255,130,30,0)']])halo.addColorStop(stop,color);
glowContext.fillStyle=halo;glowContext.fillRect(0,0,256,256);
const sunGlow=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(glowCanvas),blending:T.AdditiveBlending,transparent:true,depthWrite:false,toneMapped:false}));scene.add(sunGlow);

const trailRefs=[];
const trailGroup=new T.Group();scene.add(trailGroup);
const shipDot=new T.Mesh(new T.SphereGeometry(.18,16,16),new T.MeshBasicMaterial({color:0xe2a472}));scene.add(shipDot);const shipLabel=document.createElement('div');shipLabel.className='body-label';shipLabel.style.color='#e2a472';const shipCaption=document.createElement('span');shipCaption.textContent='VOYAGER 1';shipLabel.append(shipCaption);$('#body-labels').append(shipLabel);
let currentStates={},shipState;
function recenter(){yaw=0;pitch=0;zoom=55;camera.fov=zoom;camera.updateProjectionMatrix();}
function timelineEnd(){return Math.min(maxJD,liveJulianDate());}
function eventDate(key){return key==='today'?timelineEnd():toJD(events[key][0]);}
function syncPlaybackControls(){
 const canDetail=rate===1||rate===600;
 if(!canDetail)detailed=false;
 $('#detailed').hidden=!canDetail;
 $('#detailed').setAttribute('aria-pressed',String(detailed));
 $('.telemetry').dataset.detailed=String(detailed);

 $('#play').textContent=playing?'Ⅱ':'▶';
 $('#play').setAttribute('aria-label',playing?'Pause simulation':'Play simulation');
 $('#rate').value=String(rate);$('#rate').disabled=live;
 $('#app').dataset.live=String(live);
 $('.data-status').innerHTML=live?'<i></i> LIVE · PREDICTED':'<i></i> JPL EPHEMERIS';
 $('#progress-caption').textContent=live?'1× · JPL PREDICTED POSITION':'NASA / JPL HORIZONS';
}
function selectEvent(key){
 const e=events[key];jd=Math.max(minJD,Math.min(timelineEnd(),eventDate(key)));
 live=key==='today';target=e[4];$('#look').value=target;
 if(view==='map')mapDistance=Math.max(1500,Math.hypot(...stateAt(data.voyager.rows,jd).p)/AU*50);
 recenter();rate=live?1:['jupiter','saturn'].includes(key)?3600:key==='launch'?600:2592000;
 playing=true;syncPlaybackControls();updatePositions();renderUI();
}
function updateChapter(){let key='launch';for(const [k,e] of Object.entries(events)){if(jd>=eventDate(k)-(['jupiter','saturn'].includes(k)?10:0))key=k;}if(live)key='today';const e=events[key];$('#chapter-number').textContent=e[1];$('#chapter-label').textContent=e[2];$('#chapter-description').textContent=e[3];document.querySelectorAll('[data-event]').forEach(b=>b.classList.toggle('active',b.dataset.event===key));}
function updatePositions(){shipState=stateAt(data.voyager.rows,jd);const origin=V(shipState.p);for(const [name] of bodies)currentStates[name]=stateAt(data[name].rows,jd);
 const earthDirection=V(currentStates.earth.p).sub(origin).normalize();spacecraft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),earthDirection);
 spacecraft.visible=view!=='map';shipDot.visible=view==='map';trailGroup.visible=view==='map';
 if(view==='map'){shipDot.position.copy(origin).multiplyScalar(20/AU);shipDot.scale.setScalar(mapDistance*.025);spacecraft.position.copy(shipDot.position);}else spacecraft.position.set(0,0,0);
 for(const [name,radius] of bodies){const m=planetMeshes[name],p=V(currentStates[name].p);if(view==='map'){m.position.copy(p).multiplyScalar(20/AU);m.scale.setScalar(trueScale?radius/AU*20:mapDistance*Math.max(.002,Math.sqrt(radius/69911)*.006));}else{const relative=p.sub(origin),distance=relative.length(),renderDistance=Math.min(distance,1e7);m.position.copy(relative).multiplyScalar(renderDistance/distance);m.scale.setScalar(radius*renderDistance/distance);} }
 const sunVector=origin.clone().negate(),sunDist=sunVector.length();if(view==='map'){sun.position.set(0,0,0);sun.scale.setScalar(trueScale?695700/AU*20:.65);}else{sun.position.copy(sunVector).setLength(1e7);sun.scale.setScalar(695700/sunDist*1e7);}sunlight.position.copy(sunVector).normalize().multiplyScalar(1000);
 if(view==='ride'){camera.position.copy(new T.Vector3(.1,.95,2.6).applyQuaternion(spacecraft.quaternion));const direction=(target==='velocity'?V(shipState.v):target==='sun'?sunVector:V(currentStates[target].p).sub(origin)).normalize();const basis=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(new T.Vector3(),direction,new T.Vector3(0,1,0)));camera.quaternion.copy(basis).multiply(new T.Quaternion().setFromEuler(new T.Euler(pitch,yaw,0,'YXZ')));}
 else if(view==='craft'){const offset=new T.Vector3(Math.sin(yaw+.65)*Math.cos(pitch+.28),Math.sin(pitch+.28),Math.cos(yaw+.65)*Math.cos(pitch+.28)).multiplyScalar(orbitDistance);camera.position.copy(offset);camera.lookAt(-1.7,-.2,0);}
 else{const center=new T.Vector3();camera.position.set(Math.sin(yaw+.15)*Math.cos(pitch+.9)*mapDistance,Math.sin(pitch+.9)*mapDistance,Math.cos(yaw+.15)*Math.cos(pitch+.9)*mapDistance);camera.lookAt(center);}
 stars.position.copy(camera.position);camera.updateMatrixWorld();sunGlow.position.copy(sun.position);const observerDistanceAU=view==='map'?camera.position.distanceTo(sun.position)/20:sunDist/AU;
 const pixelWorld=2*camera.position.distanceTo(sun.position)*Math.tan(T.MathUtils.degToRad(camera.fov/2))/renderer.domElement.clientHeight;
 // Exposure-adapted glare keeps an unresolved bright source visible. The
 // sphere retains its physical angular diameter; this halo is not its edge.
 const glarePixels=76/Math.pow(Math.max(observerDistanceAU,.01),.3)*(55/camera.fov);
 sunGlow.scale.setScalar(Math.max(sun.scale.x*14,pixelWorld*glarePixels));
 sunGlow.material.opacity=1/(1+.22*Math.log1p(observerDistanceAU));const sp=shipDot.position.clone().project(camera);shipLabel.hidden=view!=='map'||!labels||Math.abs(sp.x)>.95||Math.abs(sp.y)>.8;shipLabel.style.left=(sp.x*.5+.5)*renderer.domElement.clientWidth+'px';shipLabel.style.top=(-sp.y*.5+.5)*$('#app').clientHeight+'px';for(const track of trailRefs){let lo=0,hi=track.rows.length;while(lo<hi){let m=(lo+hi)>>1;if(track.rows[m][0]<=jd)lo=m+1;else hi=m;}const end=lo;lo=0;hi=end;const startJD=jd-track.period;while(lo<hi){let m=(lo+hi)>>1;if(track.rows[m][0]<startJD)lo=m+1;else hi=m;}track.line.geometry.setDrawRange(lo,Math.max(0,end-lo));}
 for(const [name] of [...bodies,['sun']]){const m=name==='sun'?sun:planetMeshes[name],p=m.position.clone().project(camera),el=$('#label-'+name);const front=m.position.clone().sub(camera.position).dot(camera.getWorldDirection(new T.Vector3()))>0;el.hidden=!labels||!front||Math.abs(p.x)>.94||Math.abs(p.y)>.85;el.style.left=(p.x*.5+.5)*renderer.domElement.clientWidth+'px';el.style.top=(-p.y*.5+.5)*$('#app').clientHeight+'px';}
 // Keep the selected body's name legible when distant inner planets cluster.
 const occupied=[];
 const labelNames=[...bodies.map(b=>b[0]),'sun'].sort((a,b)=>(b===target)-(a===target));
 for(const name of labelNames){
  const el=$('#label-'+name),caption=el.firstElementChild;
  caption.style.visibility='visible';if(el.hidden)continue;
  const r=caption.getBoundingClientRect();
  if(occupied.some(o=>r.left<o.right+5&&r.right>o.left-5&&r.top<o.bottom+3&&r.bottom>o.top-3))caption.style.visibility='hidden';
  else occupied.push(r);
 }
}
function renderUI(){if(!shipState)return;const extra=detailed&&(rate===1||rate===600)?2:0;const speed=Math.hypot(...shipState.v),dist=Math.hypot(...shipState.p)/AU;$('#velocity').textContent=speed.toFixed(2+extra);$('#distance').textContent=dist.toFixed(3+extra);const earth=currentStates.earth.p;$('#lighttime').textContent=(Math.hypot(...shipState.p.map((p,i)=>p-earth[i]))/299792.458/3600).toFixed(2+extra)+' h';const heading=(Math.atan2(shipState.v[1],shipState.v[0])*180/Math.PI+360)%360;const lat=Math.asin(shipState.v[2]/speed)*180/Math.PI;$('#heading').textContent=heading.toFixed(1+extra)+'° / '+lat.toFixed(1+extra)+'°';$('#coordinates').textContent=shipState.p.map((p,i)=>'XYZ'[i]+' '+(p>=0?'+':'')+(p/AU).toFixed(5)).join('\n');$('#coordinates').style.whiteSpace='pre-line';$('#date').textContent=fromJD(jd).toISOString().replace('T',' · ').slice(0,21);$('#timeline').value=(jd-minJD)/(timelineEnd()-minJD)*10000;const elapsed=Number($('#timeline').value)/10000;const trackWidth=$('#timeline').clientWidth;$('#timeline').style.setProperty('--elapsed',`${elapsed<=0?0:elapsed>=1?trackWidth:8+elapsed*(trackWidth-16)}px`);updateChapter();
 const c=$('#speed-chart').getContext('2d'),w=440,h=90,pad=5;c.clearRect(0,0,w,h);
 const range=chartWindow(jd,minJD,timelineEnd(),jd<toJD('1981-01-01')?6:365);
 const speeds=Array.from({length:100},(_,i)=>Math.hypot(...stateAt(data.voyager.rows,range.start+i/99*(range.end-range.start)).v));
 const minimum=Math.min(...speeds,speed),maximum=Math.max(...speeds,speed),margin=Math.max((maximum-minimum)*.15,.00001);
 const low=minimum-margin,high=maximum+margin;
 const y=s=>h-10-(s-low)/(high-low)*(h-20);
 c.beginPath();speeds.forEach((s,i)=>{const x=pad+i/99*(w-2*pad);i?c.lineTo(x,y(s)):c.moveTo(x,y(s));});c.strokeStyle='#d3a276';c.lineWidth=2;c.stroke();
 c.beginPath();c.arc(pad+range.fraction*(w-2*pad),y(speed),3,0,Math.PI*2);c.fillStyle='#f1dbc3';c.fill();
 $('#speed-chart').dataset.markerFraction=range.fraction.toFixed(6);
 $('#speed-chart').setAttribute('aria-label',`Heliocentric speed from ${fromJD(range.start).toISOString().slice(0,10)} to ${fromJD(range.end).toISOString().slice(0,10)}`);
 $('#chart-caption').textContent=fromJD(range.start).toISOString().slice(0,10)+' — '+(live?'LIVE':fromJD(range.end).toISOString().slice(0,10));
}
function layoutMilestones(){
 if(!Number.isFinite(minJD)||!Number.isFinite(maxJD))return;
 $('#app').style.setProperty('--timeline-tail',`${$('[data-event=today]').getBoundingClientRect().width}px`);
 const track=$('.milestones'),width=track.clientWidth,rowEnds=[];let hasAbove=false;
 for(const button of track.querySelectorAll('[data-event]')){
  const fraction=Math.max(0,Math.min(1,(eventDate(button.dataset.event)-minJD)/(timelineEnd()-minJD)));
  const x=fraction*width,w=button.getBoundingClientRect().width;
  const shift=0;
  const left=x+shift;
  let row=rowEnds.findIndex(end=>left>=end+4);
  if(row<0)row=rowEnds.length;
  const above=button.dataset.event==='jupiter'&&row>0;
  button.classList.toggle('above',above);
  if(above)hasAbove=true;else rowEnds[row]=left+w;
  button.style.left=`${fraction*100}%`;
  button.style.setProperty('--shift',`${shift}px`);
  button.style.setProperty('--row-offset',`${above?-52:row*38}px`);
 }
 $('#app').style.setProperty('--timeline-top-space',hasAbove?'38px':'0px');
 track.style.height=`${Math.max(1,rowEnds.length)*38}px`;
 $('#app').style.setProperty('--footer-height',`${$('footer').offsetHeight}px`);
}
function resize(){renderer.setSize($('#app').clientWidth,$('#app').clientHeight,false);camera.aspect=$('#app').clientWidth/$('#app').clientHeight;camera.updateProjectionMatrix();layoutMilestones();}addEventListener('resize',resize);resize();
let dragging=false,px=0,py=0;const canvas=$('#universe');canvas.addEventListener('pointerdown',e=>{dragging=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw-=(e.clientX-px)*.004;pitch=Math.max(-1.3,Math.min(1.3,pitch-(e.clientY-py)*.004));px=e.clientX;py=e.clientY;});function release(){dragging=false;canvas.style.cursor='grab';}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('wheel',e=>{e.preventDefault();if(view==='ride'){zoom=Math.max(15,Math.min(95,zoom+e.deltaY*.035));camera.fov=zoom;camera.updateProjectionMatrix();}else if(view==='craft')orbitDistance=Math.max(5,Math.min(60,orbitDistance*Math.exp(e.deltaY*.001)));else mapDistance=Math.max(10,Math.min(8000,mapDistance*Math.exp(e.deltaY*.001)));},{passive:false});
$('#detailed').onclick=()=>{detailed=!detailed;syncPlaybackControls();renderUI();};
function togglePlay(){playing=!playing;if(!playing)live=false;syncPlaybackControls();}$('#play').onclick=togglePlay;addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','SELECT','BUTTON'].includes(document.activeElement.tagName)&&!$('#info').open){e.preventDefault();togglePlay();}});
$('#rate').onchange=e=>{rate=Number(e.target.value);live=false;syncPlaybackControls();};
$('#timeline').oninput=e=>{const fraction=Number(e.target.value)/10000;jd=minJD+fraction*(timelineEnd()-minJD);live=fraction===1;if(live){playing=true;rate=1;}syncPlaybackControls();updatePositions();renderUI();};
document.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>selectEvent(b.dataset.event));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));recenter();$('#reticle').hidden=view!=='ride';$('#look').disabled=view!=='ride';if(view!=='map'){$('#scale').textContent='True scale';trueScale=true;}$('#scale').disabled=view!=='map';$('#scale').style.opacity=view==='map'?1:.4;if(view==='map'){mapDistance=Math.max(1500,Math.hypot(...shipState.p)/AU*50);trueScale=false;$('#scale').textContent='Enlarged planets';}$('#view-hint').textContent=view==='ride'?'DRAG TO LOOK AROUND · SCROLL TO ZOOM':'DRAG TO ORBIT · SCROLL TO ZOOM';});$('#look').onchange=e=>{target=e.target.value;recenter();};$('#recenter').onclick=recenter;$('#labels').onclick=()=>{$('#labels').classList.toggle('active',labels=!labels);};$('#scale').onclick=()=>{if(view==='map'){trueScale=!trueScale;$('#scale').textContent=trueScale?'True scale':'Enlarged planets';}};$('#scale').disabled=true;$('#scale').style.opacity=.4;$('#info-button').onclick=()=>$('#info').showModal();$('#close-info').onclick=()=>$('#info').close();
async function init(){try{for(const name of ['voyager',...bodies.map(b=>b[0])]){const r=await fetch(`${import.meta.env.BASE_URL}data/${name}.json`);if(!r.ok)throw Error(`Missing ${name} ephemeris (${r.status})`);data[name]=await r.json();}minJD=Math.max(...Object.values(data).map(d=>d.rows[0][0]));maxJD=Math.min(...Object.values(data).map(d=>d.rows.at(-1)[0]));
 for(const name of ['voyager',...bodies.map(b=>b[0])]){const rows=data[name].rows;const path=rows;const points=path.map(row=>V(row.slice(1,4)).multiplyScalar(20/AU));const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:name==='voyager'?0xc5966e:0x46515b,transparent:true,opacity:name==='voyager'?.8:.25}));trailGroup.add(line);trailRefs.push({line,rows,period:({mercury:88,venus:225,earth:365.25,mars:687,jupiter:4333,saturn:10759,uranus:30689,neptune:60190})[name]??Infinity});}
 $('#loading').remove();layoutMilestones();document.fonts.ready.then(layoutMilestones);updatePositions();renderUI();requestAnimationFrame(frame);
 }catch(e){$('#loading-message').textContent='Could not load mission data. '+e.message;console.error(e);}}
function frame(stamp){
 const dt=lastStamp?Math.max(0,(stamp-lastStamp)/1000):0;lastStamp=stamp;
 if(playing){const next=advancePlayback(jd,dt,rate,live,timelineEnd());const switched=next.live!==live;jd=next.date;rate=next.rate;live=next.live;if(switched)syncPlaybackControls();}
 updatePositions();if(stamp-lastUI>120){renderUI();lastUI=stamp;}renderer.render(scene,camera);requestAnimationFrame(frame);
}init();
