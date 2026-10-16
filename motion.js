import * as THREE from './vendor/three.module.min.js';
import { clamp, smooth, deepTimeline } from './lib/state.js';

const reduced = matchMedia('(prefers-reduced-motion:reduce)');
const mobile = matchMedia('(max-width:760px)');
const scenes = [];
let frame = 0, lastTime = 0;
let pointerX = 0, pointerY = 0;
const white = new THREE.Color('#f6f4ee');
const random = seed => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const plastic = () => new THREE.MeshPhysicalMaterial({ color: '#ecece6', roughness: .34, metalness: 0, clearcoat: .22, clearcoatRoughness: .36 });

function lathe(profile, material, segments = 80) {
  return new THREE.Mesh(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), segments), material);
}
function environment(renderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#4b564c');
  const panel = (x, y, z, w, h, intensity, rotation = 0) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide }));
    mesh.position.set(x, y, z); mesh.rotation.y = rotation; studio.add(mesh);
  };
  panel(-3, 2, 2, 2, 5, 4, .6); panel(3, 1, 1, 1, 5, 2.5, -.7); panel(0, 5, 0, 5, 2, 3, Math.PI / 2);
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(studio, .08, .1, 20);
  generator.dispose();
  studio.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
  return target;
}
function label(group, texture, radius, height, centerY, arc) {
  // Texture contains only the original photographed ink; no label text is synthesized.
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 64, 1, true, -arc / 2, arc);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ map: texture, transparent: true, depthWrite: false, roughness: .62, polygonOffset: true, polygonOffsetFactor: -1, side: THREE.DoubleSide }));
  mesh.position.y = centerY; group.add(mesh);
}
function bottle(kind, texture) {
  const group = new THREE.Group(), material = plastic();
  let cap;
  if (kind === 'deep') {
    const profile = [[0,-1.35],[.56,-1.35],[.62,-1.345],[.67,-1.32],[.70,-1.285],[.72,-1.24],[.731,-1.18],[.735,-1.1],[.735,.57],[.734,.63],[.727,.69],[.712,.75],[.69,.81],[.66,.86],[.625,.9],[.586,.94],[.546,.975],[.509,1.01],[.48,1.05],[.466,1.09],[.46,1.14],[.46,1.43],[.405,1.43],[.405,1.12]];
    const body = lathe(profile, material); group.add(body);
    const inside = lathe([[.405,1.43],[.405,1.06],[.5,.88],[.62,.7],[.63,.5]], new THREE.MeshStandardMaterial({ color:'#b8b9aa',roughness:.85,side:THREE.DoubleSide })); group.add(inside);
    const dark = new THREE.Mesh(new THREE.CircleGeometry(.405, 48), new THREE.MeshStandardMaterial({ color: '#3a3a2c', roughness: 1 }));
    dark.rotation.x = -Math.PI / 2; dark.position.y = 1.06; group.add(dark);
    for (let i=0;i<3;i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.464, .015, 6, 64), material); ring.rotation.x=Math.PI/2;ring.position.y=1.18+i*.07;group.add(ring); }
    label(group, texture, .739, 1.65, -.3, 1.65);
    cap = new THREE.Group(); cap.position.y = 1.52;
    cap.add(lathe([[.0,-.22],[.48,-.22],[.51,-.2],[.52,-.16],[.52,.18],[.5,.22],[0,.22]], material));
    const ribs = new THREE.InstancedMesh(new THREE.CylinderGeometry(.0045,.0045,.33,4), material, 100);
    const dummy = new THREE.Object3D();
    for (let i=0;i<100;i++){const angle=i/100*Math.PI*2;dummy.position.set(Math.sin(angle)*.521,0,Math.cos(angle)*.521);dummy.updateMatrix();ribs.setMatrixAt(i,dummy.matrix);} cap.add(ribs);
    const underside = new THREE.Mesh(new THREE.RingGeometry(.38,.48,64),new THREE.MeshStandardMaterial({color:'#cbccc4',roughness:.8,side:THREE.DoubleSide}));underside.rotation.x=Math.PI/2;underside.position.y=-.216;cap.add(underside);
  } else {
    group.add(lathe([[0,-1.05],[.78,-1.05],[.91,-1.02],[.98,-.92],[.99,-.77],[.99,.62],[.97,.72],[.91,.77],[.91,.88],[0,.88]],material));
    label(group,texture,.994,1.52,-.12,1.65);
    cap = new THREE.Group();cap.position.y=.97;
    cap.add(lathe([[0,-.16],[.96,-.16],[1.02,-.13],[1.035,-.08],[1.035,.2],[1.01,.25],[.92,.27],[0,.27]],material));
    const edge=new THREE.Mesh(new THREE.TorusGeometry(1.025,.008,6,96),new THREE.MeshStandardMaterial({color:'#deded5',roughness:.6}));edge.rotation.x=Math.PI/2;edge.position.y=-.06;cap.add(edge);
  }
  group.add(cap);return {group,cap};
}
function capsules() {
  const group = new THREE.Group();
  const data = new Uint8Array(64 * 64 * 4);
  for (let i=0;i<data.length;i+=4){const shade=160+Math.round(random(i)*90);data[i]=shade;data[i+1]=shade;data[i+2]=shade;data[i+3]=255;}
  const bump = new THREE.DataTexture(data,64,64);bump.needsUpdate=true;bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  const material = new THREE.MeshPhysicalMaterial({color:'#d3c3a5',roughness:.47,clearcoat:.32,clearcoatRoughness:.5,bumpMap:bump,bumpScale:.006});
  const seamMaterial = new THREE.MeshStandardMaterial({color:'#b0a082',roughness:.56});
  const geometry=new THREE.CapsuleGeometry(.068,.21,6,12);
  const seamGeometry=new THREE.TorusGeometry(.069,.0022,4,18);
  const count=mobile.matches?22:34;
  const items=[];
  for(let i=0;i<count;i++){
    const pill=new THREE.Group();pill.add(new THREE.Mesh(geometry,material));
    const seam=new THREE.Mesh(seamGeometry,seamMaterial);seam.rotation.x=Math.PI/2;pill.add(seam);
    const angle=i*2.3999632297,radius=1.1+Math.sqrt((i+1)/count)*1.05;
    const target=new THREE.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius*.76+.8,(random(i+1)-.5)*2.1);
    items.push({pill,target,rotation:new THREE.Vector3(random(i+3)*5,random(i+5)*5,random(i+7)*5),delay:random(i+9)*.1});
    group.add(pill);
  }
  return {group,items};
}
function powder() {
  const count=mobile.matches?450:1000;
  const positions=new Float32Array(count*3), colors=new Float32Array(count*3), seeds=[];
  for(let i=0;i<count;i++){
    const angle=i*2.39996, radius=1.5+random(i+1)*1.5;
    seeds.push({angle,radius,z:(random(i+3)-.5)*1.4});
    const color=white.clone().multiplyScalar(.65+random(i+9)*.35);color.toArray(colors,i*3);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material=new THREE.PointsMaterial({size:mobile.matches ? .016 : .012,vertexColors:true,transparent:true,opacity:.65,depthWrite:false,sizeAttenuation:true});
  // Round point sprites avoid square pixels in the close foreground.
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n float d=length(gl_PointCoord-vec2(0.5)); if(d>0.5) discard;');};
  const points=new THREE.Points(geometry,material);points.frustumCulled=false;
  return {points,seeds,positions};
}
async function createScene(section) {
  const kind=section.dataset.scene, stage=section.querySelector('[data-stage]'),host=stage.querySelector('.scene-canvas');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:!mobile.matches,powerPreference:'low-power'});}catch{stage.dataset.fallback='true';return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile.matches?1.25:1.65));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene();const env=environment(renderer);scene.environment=env.texture;scene.environmentIntensity=.65;
  const camera=new THREE.PerspectiveCamera(34,1,.1,40);camera.position.set(0,.85,9.4);camera.lookAt(0,.55,0);
  scene.add(new THREE.HemisphereLight('#f4f1e4','#263829',.9));
  const key=new THREE.DirectionalLight('#f6f0dd',3);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(mobile.matches?512:1024,mobile.matches?512:1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;key.shadow.bias=-.0005;key.shadow.normalBias=.012;scene.add(key);
  const rim=new THREE.DirectionalLight('#c5d6c0',2.5);rim.position.set(4,2,-2);scene.add(rim);
  const fill=new THREE.DirectionalLight('#f6f4ee',.5);fill.position.set(2,0,5);scene.add(fill);
  let texture;
  try{texture=await new THREE.TextureLoader().loadAsync(`assets/${kind}-label.png`);}catch{renderer.dispose();env.dispose();stage.dataset.fallback='true';return;}
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
  const product=bottle(kind,texture);scene.add(product.group);
  product.group.traverse(object=>{if(object.isMesh&&!object.material.transparent){object.castShadow=true;object.receiveShadow=true;}});
  const pills=kind==='deep'?capsules():null;if(pills)scene.add(pills.group);
  const dust=kind==='output'?powder():null;if(dust)scene.add(dust.points);
  const orbitGroup=new THREE.Group();
  if(kind==='output'){
    for(let i=0;i<2;i++){
      const points=[];for(let j=0;j<=160;j++){const a=j/160*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*(2.03+i*.34),Math.sin(a)*(.65+i*.2),Math.sin(a)*.9));}
      const orbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#bac9a4',transparent:true,opacity:i?.14:.28}));orbit.rotation.z=-.25+i*.25;orbitGroup.add(orbit);
    }scene.add(orbitGroup);
  }
  host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
  const state={section,stage,host,renderer,scene,camera,product,pills,dust,orbitGroup,visible:false,paused:false,current:0,target:0,phase:section.querySelector('[data-phase]'),progress:section.querySelector('.scene-progress span'),lastRender:0,frames:0,samples:[],qualityReduced:false};
  scenes.push(state);
  const resize=()=>{const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.position.z=kind==='deep'?(camera.aspect<.95?10.6:9.5):(camera.aspect<.95?9.4:8.4);camera.updateProjectionMatrix();requestFrame();};
  new ResizeObserver(resize).observe(host);resize();
  new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting;if(state.visible){measure(state);requestFrame();}},{rootMargin:'100px'}).observe(section);
  const toggle=section.querySelector('.motion-toggle');toggle.addEventListener('click',()=>{state.paused=!state.paused;toggle.textContent=state.paused?'Resume motion':'Pause motion';toggle.setAttribute('aria-pressed',String(state.paused));requestFrame();});
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();stage.dataset.ready='false';stage.dataset.fallback='true';state.paused=true;});
  draw(state,0);stage.dataset.ready='true';
}
function measure(state){const rect=state.section.getBoundingClientRect();state.target=clamp(-rect.top/Math.max(1,rect.height-innerHeight));}
function draw(state,p){
  const {product,pills,dust,camera,renderer,scene}=state;
  if(state.section.dataset.scene==='deep'){
    const t=deepTimeline(p);
    product.group.position.y=-.23+(1-t.arrival)*-.55;
    product.group.rotation.set(.03+Math.sin(p*Math.PI)*.045,-.08+Math.sin(p*Math.PI)*.15,-.035+Math.sin(p*Math.PI)*-.07);
    product.group.scale.setScalar(.88+t.arrival*.12);
    product.cap.position.y=1.52+t.opening*1.35;product.cap.position.x=t.opening*.13;
    product.cap.rotation.set(t.opening*-.11,t.opening*Math.PI*3.2,t.opening*.06);
    for(const [i,item] of pills.items.entries()){
      const e=smooth(clamp((t.expansion-item.delay)/(1-item.delay)));
      item.pill.visible=e>.008;
      // A shared mouth origin and continuous reversible paths keep capsules inside until open.
      item.pill.position.set(item.target.x*e,1.23+(item.target.y-1.23)*e+Math.sin(e*Math.PI)*.55,item.target.z*e);
      item.pill.rotation.set(item.rotation.x*e,item.rotation.y*e,item.rotation.z*e);
      item.pill.position.x+=Math.sin(p*20+i)*t.suspension*.035;
      item.pill.position.y+=Math.cos(p*14+i)*t.suspension*.05;
      item.pill.scale.setScalar(.5+e*.5);
    }
    if(state.phase)state.phase.textContent=t.phase;
  }else{
    const e=smooth(p);
    product.group.position.y=Math.sin(p*Math.PI)*.16-.16;
    product.group.rotation.set(-.12+e*.14,-.18+e*.34,-.13+e*.24);
    product.group.scale.setScalar(.94+Math.sin(p*Math.PI)*.06);
    for(let i=0;i<dust.seeds.length;i++){
      const s=dust.seeds[i],a=s.angle+e*.9,r=s.radius*(.55+Math.sin(p*Math.PI)*.6);
      dust.positions[i*3]=Math.cos(a)*r;dust.positions[i*3+1]=Math.sin(a)*r*.48+.1;dust.positions[i*3+2]=s.z+Math.sin(a)*.75;
    }
    dust.points.geometry.attributes.position.needsUpdate=true;dust.points.rotation.z=e*.25;
    dust.points.material.opacity=.2+Math.sin(p*Math.PI)*.55;
    state.orbitGroup.rotation.y=e*.25;
  }
  const targetY=state.section.dataset.scene==='deep' ? .6 : .2;
  camera.position.x=pointerX*.09;camera.position.y=(state.section.dataset.scene==='deep'?1.3:.6)+pointerY*.05;camera.lookAt(0,targetY,0);
  state.progress.style.transform=`scaleX(${p})`;
  renderer.render(scene,camera);
}
function requestFrame(){if(!frame&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
function tick(time){
  frame=0;if(document.hidden||reduced.matches)return;
  const dt=Math.min((time-lastTime)||16.7,60);lastTime=time;let active=false;
  for(const state of scenes){
    if(!state.visible||state.paused)continue;
    const delta=state.target-state.current;
    if(Math.abs(delta)>.00015){state.current+=delta*(1-Math.exp(-dt/95));active=true;}else state.current=state.target;
    const start=performance.now();draw(state,state.current);const duration=performance.now()-start;
    // Reduce resolution once for sustained expensive CPU submission, never increase work on weak devices.
    if(++state.frames<=30)state.samples.push(duration);
    if(state.frames===30&&!state.qualityReduced&&state.samples.reduce((a,b)=>a+b,0)/30>18){state.renderer.setPixelRatio(1);const r=state.host.getBoundingClientRect();state.renderer.setSize(r.width,r.height,false);state.qualityReduced=true;}
  }
  if(active)requestFrame();
}
export async function initializeMotion(){
  // One renderer initializes at a time to avoid a pair of GPU compilation spikes.
  for(const section of document.querySelectorAll('.motion-section'))await createScene(section);
  addEventListener('scroll',()=>{scenes.forEach(state=>{if(state.visible)measure(state);});requestFrame();},{passive:true});
  addEventListener('resize',()=>{scenes.forEach(measure);requestFrame();},{passive:true});
  addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;pointerX=(event.clientX/innerWidth-.5)*2;pointerY=(event.clientY/innerHeight-.5)*2;if(scenes.some(state=>state.visible&&!state.paused))requestFrame();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{scenes.forEach(measure);requestFrame();}});
  reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(frame);frame=0;}else requestFrame();});
  scenes.forEach(measure);requestFrame();
}
