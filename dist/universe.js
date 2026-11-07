(() => {
  'use strict';
  const root = document.documentElement;
  const canvas = document.querySelector('#project-sphere');
  const context = canvas.getContext('2d');
  const ambientCanvas = document.querySelector('#scroll-sphere');
  const ambientContext = ambientCanvas.getContext('2d');
  const stage = document.querySelector('.globe-stage');
  const nodeGroup = document.querySelector('#network-projects');
  const count = document.querySelector('#network-count');
  const pagination = document.querySelector('.network-pagination');
  const previous = document.querySelector('#network-prev');
  const next = document.querySelector('#network-next');
  const pageLabel = document.querySelector('#network-page');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const initial = { yaw: .52, pitch: -.16 };
  const state = { ...initial, width: 0, height: 0, radius: 0, page: 0, items: window.ARMS_PROJECTS.slice(), nodes: [], active: null, dragging: null, suppressClick:false, visible: true, frame: 0, lastFrame: 0, clock:0, camera:{scale:1,x:0,y:0}, zoomFrame:0, selected:null, zoomProgress:0, assembly:reduced.matches?1:.25, scrollDirty:true, ambientOpacity:0, ambientTarget:0, ambientScale:.5, section:null, sectionProgress:0 };
  const colors = { mesh:[89,156,174], gold:[236,196,126], highlight:[236,196,126], blue:[89,156,174], bronze:[176,129,74], steel:[55,70,77] };
  const colorFor = area => colors[area === 'supply' ? 'gold' : area === 'robotics' ? 'blue' : 'bronze'];
  const rgba = (rgb, alpha) => `rgba(${rgb.join(',')},${alpha})`;

  // A geodesic mesh uses 1,280 triangles on desktop and 320 on smaller screens.
  const t = (1 + Math.sqrt(5)) / 2;
  const normalize = v => { const length = Math.hypot(...v); return v.map(n => n / length); };
  const vertices = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(normalize);
  let faces = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  let coarseFaces, coarseCount;
  for (let level = 0; level < 3; level++) {
    const midpoints = new Map();
    const midpoint = (a, b) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (midpoints.has(key)) return midpoints.get(key);
      const index = vertices.push(normalize(vertices[a].map((n,i) => (n + vertices[b][i]) / 2))) - 1;
      midpoints.set(key, index);
      return index;
    };
    faces = faces.flatMap(([a,b,c]) => {
      const ab = midpoint(a,b), bc = midpoint(b,c), ca = midpoint(c,a);
      return [[a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]];
    });
    if(level===1){coarseFaces=faces;coarseCount=vertices.length;}
  }
  function meshData(list,points) {
    const uniqueEdges=new Map();
    list.forEach(face=>face.forEach((a,i)=>{const b=face[(i+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;uniqueEdges.set(key,[a,b]);}));
    const edges=[...uniqueEdges.values()];
    return {faces:list,vertices:points,edges,edgeCenters:edges.map(([a,b])=>vertices[a].map((n,i)=>(n+vertices[b][i])/2)),centers:list.map(face=>face.reduce((sum,index)=>sum.map((n,i)=>n+vertices[index][i]/3),[0,0,0]))};
  }
  const fineMesh=meshData(faces,vertices),coarseMesh=meshData(coarseFaces,vertices.slice(0,coarseCount));
  let edges=fineMesh.edges, centers=fineMesh.centers, activeVertices=vertices, edgeCenters=fineMesh.edgeCenters;
  const clamp = (n,min=0,max=1) => Math.max(min,Math.min(max,n));
  const smooth = (low,high,n) => { const value=clamp((n-low)/(high-low)); return value*value*(3-2*value); };
  function facetLife(v,index) {
    if(reduced.matches)return 1;
    const wave=Math.sin(state.clock*.00055+v[0]*4.8+v[1]*3.4+v[2]*2.3);
    const detail=Math.sin(state.clock*.00033+index*2.399)*.22;
    return smooth(-.8,.68,wave+detail)*state.assembly;
  }

  function project(v) {
    const yaw=state.yaw, pitch=state.pitch;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x = v[0]*cy + v[2]*sy;
    const z = -v[0]*sy + v[2]*cy;
    const y = v[1]*cp - z*sp;
    const depth = v[1]*sp + z*cp;
    const perspective = 4 / (4 - depth*.55);
    return { x: state.width/2 + x*state.radius*perspective, y: state.height/2 + y*state.radius*perspective, z: depth };
  }

  function cameraPoint(point) {
    const {scale,x,y}=state.camera;
    return {x:state.width/2+(point.x-state.width/2)*scale+x,y:state.height/2+(point.y-state.height/2)*scale+y,z:point.z};
  }

  // Six directions cover the entire shell, including its hidden rear hemisphere.
  function orbitalVector(index,total) {
    const first=[-.64,-.6,.48];
    const candidate=[.75,-.6,.28],dot=candidate.reduce((sum,n,i)=>sum+n*first[i],0);
    const second=normalize(candidate.map((n,i)=>n-dot*first[i]));
    const third=[first[1]*second[2]-first[2]*second[1],first[2]*second[0]-first[0]*second[2],first[0]*second[1]-first[1]*second[0]];
    const directions=[first,second,third,...[first,second,third].map(v=>v.map(n=>-n))];
    const [x,y,depth]=directions[index].map(n=>n*1.1);
    const vy=y*Math.cos(initial.pitch)+depth*Math.sin(initial.pitch);
    const vz=-y*Math.sin(initial.pitch)+depth*Math.cos(initial.pitch);
    return [x*Math.cos(initial.yaw)-vz*Math.sin(initial.yaw),vy,x*Math.sin(initial.yaw)+vz*Math.cos(initial.yaw)];
  }

  function layoutNodes() {
    const {width:w,height:h}=state;
    const boxes=[];
    state.nodes.forEach(node=>{
      const point=cameraPoint(project(node.vector));node.point=point;
      node.visible=point.z>.04;
      node.button.hidden=!node.visible;
      node.button.classList.toggle('is-selected',state.selected===node);
      node.button.setAttribute('aria-expanded',String(state.selected===node));
      if(!node.visible)return;
      node.button.style.setProperty('--node-x',`${point.x}px`);
      node.button.style.setProperty('--node-y',`${point.y}px`);
      node.button.style.zIndex=String(10+Math.round((point.z+2)*10));
      node.button.querySelector('.node-dot').style.scale=state.selected===node?String(1.4+state.zoomProgress*.45):'';
      node.button.style.opacity=state.selected&&state.selected!==node?String(1-state.zoomProgress*.3):'1';
      const width=node.label.offsetWidth,height=node.label.offsetHeight;
      let left=clamp(point.x-width/2,8,w-width-8);
      let top=clamp(point.y<h/2?point.y-height-26:point.y+26,8,h-height-8);
      if(left<w/2+88&&left+width>w/2-88&&top<h/2+48&&top+height>h/2-48){
        left=clamp(point.x<w/2?w/2-96-width:w/2+96,8,w-width-8);
      }
      boxes.push({node,left,top,width,height});
    });
    // Keep the small text labels readable when a drag brings points together.
    for(let pass=0;pass<12;pass++){
      let changed=false;
      for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){
        const first=boxes[a],second=boxes[b];
        if(first.left<second.left+second.width+4&&first.left+first.width+4>second.left&&first.top<second.top+second.height+7&&first.top+first.height+7>second.top){
          const upper=first.top<=second.top?first:second,lower=upper===first?second:first;
          const move=(upper.top+upper.height+7-lower.top)/2;
          upper.top=clamp(upper.top-move,8,h-upper.height-8);
          lower.top=clamp(lower.top+move,8,h-lower.height-8);changed=true;
        }
      }
      if(!changed)break;
    }
    boxes.forEach(({node,left,top,width,height})=>{
      node.label.style.left=`${left-node.point.x+22}px`;
      node.label.style.top=`${top-node.point.y+22}px`;
      node.label.style.opacity=state.selected&&state.selected!==node?'0.8':'1';
      node.labelEnd={x:clamp(node.point.x,left,left+width),y:clamp(node.point.y,top,top+height)};
    });
    document.querySelector('.globe-core').style.opacity=String(1-state.zoomProgress*.6);
  }

  function renderNodes() {
    const totalPages = Math.max(1,Math.ceil(state.items.length/6));
    state.page = Math.min(state.page,totalPages-1);
    state.nodes = [];
    nodeGroup.replaceChildren();
    state.items.slice(state.page*6,state.page*6+6).forEach((item,index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'network-node';
      button.dataset.area = item.area; button.dataset.project = item.id;
      button.setAttribute('aria-label',`Explore project: ${item.title}`);
      button.style.setProperty('--node-delay',`${300+index*90}ms`);
      button.setAttribute('aria-controls','project-inspector');button.setAttribute('aria-expanded','false');
      const dot=document.createElement('span');dot.className='node-dot';dot.setAttribute('aria-hidden','true');
      const symbol=document.createElementNS('http://www.w3.org/2000/svg','svg');
      symbol.setAttribute('viewBox','0 0 24 24');symbol.setAttribute('class','node-symbol');symbol.setAttribute('aria-hidden','true');
      const icons={supply:'M3 7h7v7H3zM14 10h7v7h-7zM6 4h12l-2-2M18 4l-2 2M18 20H6l2-2M6 20l2 2',robotics:'M7 7h10v10H7zM10 10h4v4h-4zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4',mechanical:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1'};
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',icons[item.area]);symbol.append(path);dot.append(symbol);
      const label = document.createElement('span');label.className='node-label';
      const discipline=document.createElement('small');
      discipline.textContent = `${String(state.page*6+index+1).padStart(2,'0')} / ${item.area === 'supply' ? 'SUPPLY' : item.area === 'robotics' ? 'ROBOTICS' : 'MECHANICAL'}`;
      const title = document.createElement('strong'); title.textContent = item.networkTitle || item.title;
      label.append(discipline,title);button.append(dot,label); nodeGroup.append(button);
      const total=Math.min(6,state.items.length-state.page*6);
      const node = { item,button,label,vector:orbitalVector(index,total) }; state.nodes.push(node);
      button.addEventListener('click',event=>{if(event.detail&&state.suppressClick)return;zoomToProject(node);});
      const activate = () => { state.active=item.id; draw(); };
      const deactivate = () => { state.active=state.selected?.item.id||null; draw(); };
      button.addEventListener('pointerenter',activate); button.addEventListener('pointerleave',deactivate);
      button.addEventListener('focus',activate); button.addEventListener('blur',deactivate);
    });
    count.textContent = `${String(state.items.length).padStart(2,'0')} CONCEPT${state.items.length===1?'':'S'}`;
    pagination.hidden=totalPages<=1;
    previous.disabled=state.page===0; next.disabled=state.page>=totalPages-1;
    pageLabel.textContent=`${state.page+1} / ${totalPages}`;
    layoutNodes(); draw();
  }

  const status=document.querySelector('#network-status');
  function resetCamera() {
    cancelAnimationFrame(state.zoomFrame);state.zoomFrame=0;
    state.camera={scale:1,x:0,y:0};state.selected=null;state.active=null;state.zoomProgress=0;state.suppressClick=false;
    stage.classList.remove('is-zooming');status.textContent='';draw();
  }
  function zoomToProject(node,{showPanel=true}={}) {
    cancelAnimationFrame(state.zoomFrame);
    state.selected=node;state.active=node.item.id;stage.classList.add('is-zooming');
    status.textContent=`Exploring ${node.item.networkTitle || node.item.title}…`;
    const point=project(node.vector),start=performance.now(),from={...state.camera};
    const scale=1.12,target={scale,x:(state.width/2-point.x)*scale*.15,y:(state.height/2-point.y)*scale*.15};
    if(showPanel)openProject(node.item.id,{fromSphere:true});
    function advance(time) {
      const progress=reduced.matches?1:clamp((time-start)/650);
      const ease=1-Math.pow(1-progress,3);
      state.zoomProgress=ease;
      state.camera={scale:from.scale+(target.scale-from.scale)*ease,x:from.x+(target.x-from.x)*ease,y:from.y+(target.y-from.y)*ease};
      draw();
      if(progress<1)state.zoomFrame=requestAnimationFrame(advance);
      else{state.zoomFrame=0;status.textContent='';stage.classList.remove('is-zooming');}
    }
    state.zoomFrame=requestAnimationFrame(advance);
  }
  window.addEventListener('arms:project-closed',resetCamera);
  window.addEventListener('arms:project-selected',event=>{
    const index=state.items.findIndex(item=>item.id===event.detail.id);if(index<0)return;
    state.page=Math.floor(index/6);resetCamera();renderNodes();
    const node=state.nodes.find(node=>node.item.id===event.detail.id);if(!node)return;
    state.yaw=-Math.atan2(node.vector[0],node.vector[2]);
    state.pitch=clamp(Math.atan2(node.vector[1],Math.hypot(node.vector[0],node.vector[2])),-1,1);
    zoomToProject(node,{showPanel:false});
  });

  function line(a,b) { context.moveTo(a.x,a.y); context.lineTo(b.x,b.y); }

  function draw() {
    if (!context || !state.width) return;
    const {width:w,height:h,radius:r}=state, cx=w/2, cy=h/2;
    context.clearRect(0,0,w,h);
    layoutNodes();
    context.save();
    context.translate(cx+state.camera.x,cy+state.camera.y);context.scale(state.camera.scale,state.camera.scale);context.translate(-cx,-cy);
    const halo=context.createRadialGradient(cx,cy,r*.15,cx,cy,r*1.6);
    halo.addColorStop(0,'rgba(89,156,174,.12)'); halo.addColorStop(.6,'rgba(89,156,174,.08)'); halo.addColorStop(1,'rgba(89,156,174,0)');
    context.fillStyle=halo; context.fillRect(0,0,w,h);
    context.save(); context.strokeStyle='rgba(236,196,126,.24)'; context.lineWidth=.7; context.setLineDash([3,7]);context.lineDashOffset=-state.clock*.007;
    context.beginPath(); context.ellipse(cx,cy,r*1.31,r*.47,-.38,0,Math.PI*2); context.stroke();
    context.beginPath(); context.ellipse(cx,cy,r*1.1,r*1.1,0,0,Math.PI*2); context.stroke(); context.restore();
    const projected=activeVertices.map(project);
    // Draw distant facets first, then the near side for dimensional depth.
    const lives=centers.map(facetLife);
    faces.map((face,index)=>({face,index,depth:face.reduce((sum,i)=>sum+projected[i].z,0)/3})).sort((a,b)=>a.depth-b.depth).forEach(({face,index,depth})=>{
      if(depth<-.2)return;
      const life=lives[index];if(life<.025)return;
      const raised=index%(faces.length>400?29:13)===0;
      const normal=normalize(centers[index]);
      const lift=raised?(.14+(index%5)*.035)*(.7+.3*life):0;
      const displacement=lift+(1-life)*.045;
      const points=face.map(i=>project(vertices[i].map((n,j)=>n+normal[j]*displacement)));
      const [a,b,c]=points;
      if(raised){
        // Real world-space extrusion: side walls join the lifted panel to the shell.
        face.forEach((vertex,j)=>{
          const base=projected[vertex],baseNext=projected[face[(j+1)%3]],tip=points[j],tipNext=points[(j+1)%3];
          context.beginPath();context.moveTo(base.x,base.y);context.lineTo(baseNext.x,baseNext.y);context.lineTo(tipNext.x,tipNext.y);context.lineTo(tip.x,tip.y);context.closePath();
          context.fillStyle=rgba(colors.mesh,life*.15);context.fill();
          context.beginPath();line(base,tip);context.strokeStyle=rgba(colors.highlight,life*.3);context.lineWidth=.7;context.stroke();
        });
      }
      context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);context.lineTo(c.x,c.y);context.closePath();
      const highlight=raised||index%11===0;
      const accent=raised&&index%2?colors.bronze:colors.highlight;
      context.fillStyle= highlight ? rgba(accent,life*((raised?.16:.025)+Math.max(0,depth)*.12)) : rgba(colors.steel,life*(.08+Math.max(0,depth)*.17));
      context.fill();
      if(highlight){context.strokeStyle=rgba(accent,life*(raised?.85:.55));context.lineWidth=raised?1.1:.8;context.stroke();}
    });
    const edgeLives=edgeCenters.map(facetLife);
    for(let band=0;band<4;band++){
      context.beginPath();
      edges.forEach(([a,b],index)=>{const depth=(projected[a].z+projected[b].z)/2;const category=Math.min(3,Math.floor((depth+1)*2));if(category===band&&edgeLives[index]>.12)line(projected[a],projected[b]);});
      context.strokeStyle=rgba(colors.mesh,[.08,.17,.34,.62][band]);context.lineWidth=band===3?.9:.6;context.stroke();
    }
    // A quiet inner lattice remains visible as outer panels materialize and dissolve.
    context.beginPath();edges.forEach(([a,b],i)=>{if(i%3===0){const inner=point=>({x:cx+(point.x-cx)*.63,y:cy+(point.y-cy)*.63});line(inner(projected[a]),inner(projected[b]));}});
    context.strokeStyle=rgba(colors.mesh,.09);context.lineWidth=.55;context.stroke();
    projected.forEach((point,index)=>{
      if(point.z<-.2)return;
      context.beginPath();context.arc(point.x,point.y,index%7===0?2:1.1,0,Math.PI*2);
      const life=facetLife(vertices[index],index);
      context.fillStyle=rgba(index%7===0?colors.highlight:colors.mesh,(.12+Math.max(0,point.z)*.75)*life);context.fill();
    });
    state.nodes.forEach(node=>{
      if(!node.visible)return;
      const start=project(normalize(node.vector)),end=project(node.vector);
      const active=state.active===node.item.id;
      const rgb=colorFor(node.item.area);
      context.beginPath();context.moveTo(start.x,start.y);context.lineTo(end.x,end.y);
      context.strokeStyle=rgba(rgb,active?.95:.42);context.lineWidth=active?1.6:.8;
      if(active){context.shadowColor=rgba(rgb,.8);context.shadowBlur=9;}context.stroke();context.shadowBlur=0;
      [start,end].forEach((point,i)=>{context.beginPath();context.arc(point.x,point.y,i?2:3,0,Math.PI*2);context.fillStyle=rgba(rgb,active?1:.85);context.fill();});
      // A small signal moves from the mesh to its project while motion is enabled.
      if(mayAnimate()){
        const progress=(state.clock*.00018+state.nodes.indexOf(node)*.16)%1;
        const point={x:start.x+(end.x-start.x)*progress,y:start.y+(end.y-start.y)*progress};
        context.beginPath();context.arc(point.x,point.y,active?2.8:1.7,0,Math.PI*2);context.fillStyle=rgba(rgb,.95);context.fill();
      }
    });
    context.restore();
    state.nodes.filter(node=>node.visible).forEach(node=>{
      context.beginPath();context.moveTo(node.point.x,node.point.y);context.lineTo(node.labelEnd.x,node.labelEnd.y);
      context.strokeStyle=rgba(colorFor(node.item.area),.18);context.lineWidth=.6;context.stroke();
    });
    context.strokeStyle='rgba(236,196,126,.3)';context.lineWidth=1;
    [[12,26,1,1],[w-12,26,-1,1],[12,h-26,1,-1],[w-12,h-26,-1,-1]].forEach(([x,y,dx,dy])=>{context.beginPath();context.moveTo(x+dx*13,y);context.lineTo(x,y);context.lineTo(x,y+dy*13);context.stroke();});
  }

  function drawAmbient() {
    if(!ambientContext)return;
    const w=innerWidth,h=innerHeight;ambientContext.clearRect(0,0,w,h);
    if(state.ambientOpacity<.003)return;
    const scale=state.ambientScale;
    const r=Math.min(w*.27,270)*scale;
    const cx=w*(w<600?.7:.78),cy=h*(.6-state.sectionProgress*.14);
    const yaw=state.yaw*.55+state.sectionProgress*.9;
    const pitch=-.3;
    const points=activeVertices.map(v=>{
      const x=v[0]*Math.cos(yaw)+v[2]*Math.sin(yaw),z=-v[0]*Math.sin(yaw)+v[2]*Math.cos(yaw);
      const y=v[1]*Math.cos(pitch)-z*Math.sin(pitch),depth=v[1]*Math.sin(pitch)+z*Math.cos(pitch);
      const perspective=4/(4-depth*.4);
      return {x:cx+x*r*perspective,y:cy+y*r*perspective,z:depth};
    });
    ambientContext.globalAlpha=state.ambientOpacity;
    const glow=ambientContext.createRadialGradient(cx,cy,0,cx,cy,r*1.5);glow.addColorStop(0,'rgba(89,156,174,.25)');glow.addColorStop(1,'rgba(89,156,174,0)');ambientContext.fillStyle=glow;ambientContext.fillRect(0,0,w,h);
    faces.forEach((face,index)=>{
      if(index%3)return;const life=facetLife(centers[index],index);if(life<.22)return;
      const [a,b,c]=face.map(i=>points[i]);if((a.z+b.z+c.z)<0)return;
      ambientContext.beginPath();ambientContext.moveTo(a.x,a.y);ambientContext.lineTo(b.x,b.y);ambientContext.lineTo(c.x,c.y);ambientContext.closePath();
      ambientContext.fillStyle=rgba(index%11?colors.mesh:colors.highlight,life*.12);ambientContext.fill();
    });
    ambientContext.beginPath();edges.forEach(([a,b],index)=>{if(index%2)return;const life=facetLife(vertices[a],index);if(life<.2)return;ambientContext.moveTo(points[a].x,points[a].y);ambientContext.lineTo(points[b].x,points[b].y);});
    ambientContext.strokeStyle=rgba(colors.mesh,.7);ambientContext.lineWidth=.8;ambientContext.stroke();
    ambientContext.beginPath();ambientContext.ellipse(cx,cy,r*1.24,r*.44,-.4,0,Math.PI*2);ambientContext.strokeStyle=rgba(colors.highlight,.3);ambientContext.stroke();
    points.forEach((point,index)=>{if(index%15||point.z<0)return;ambientContext.beginPath();ambientContext.arc(point.x,point.y,2,0,Math.PI*2);ambientContext.fillStyle=rgba(colors.highlight,.85);ambientContext.fill();});
    ambientContext.globalAlpha=1;
  }

  const sections=[...document.querySelectorAll('main>.section')];
  function updateScroll() {
    state.scrollDirty=false;
    const center=innerHeight*.6;
    const section=sections.find(element=>{const r=element.getBoundingClientRect();return r.top<center&&r.bottom>center;});
    if(!section){state.ambientTarget=0;return;}
    const box=section.getBoundingClientRect();
    state.sectionProgress=clamp((innerHeight-box.top)/(innerHeight+box.height));
    if(state.section!==section){state.section=section;state.ambientScale=.45;}
    const amount=smooth(.08,.4,state.sectionProgress);
    state.ambientTarget=(section.matches('.portfolio,.join')?0:.34)*amount;
    if(reduced.matches){state.ambientOpacity=0;state.ambientTarget=0;}
  }

  function resize() {
    const mesh=innerWidth>920?fineMesh:coarseMesh;
    faces=mesh.faces;edges=mesh.edges;centers=mesh.centers;activeVertices=mesh.vertices;edgeCenters=mesh.edgeCenters;
    const box=stage.getBoundingClientRect();state.width=box.width;state.height=box.height;state.radius=Math.min(box.width*.37,box.height*.38);
    if(state.selected&&!state.zoomFrame&&state.zoomProgress>0){const point=project(state.selected.vector),scale=state.camera.scale;state.camera.x=(state.width/2-point.x)*scale*.15;state.camera.y=(state.height/2-point.y)*scale*.15;}
    if(context){const ratio=Math.min(devicePixelRatio||1,box.width<500?1.5:2);canvas.width=Math.round(box.width*ratio);canvas.height=Math.round(box.height*ratio);context.setTransform(ratio,0,0,ratio,0,0);}
    if(ambientContext){const ratio=Math.min(devicePixelRatio||1,1.25);ambientCanvas.width=Math.round(innerWidth*ratio);ambientCanvas.height=Math.round(innerHeight*ratio);ambientContext.setTransform(ratio,0,0,ratio,0,0);}
    updateScroll();layoutNodes();draw();drawAmbient();syncMotion();
  }

  function mayAnimate() { return Boolean(context)&&!reduced.matches&&(state.visible||state.ambientTarget>.003||state.ambientOpacity>.003)&&!document.hidden; }
  function tick(time) {
    state.frame=0;
    if(state.scrollDirty)updateScroll();
    if(!mayAnimate()){state.lastFrame=0;return;}
    if(!state.lastFrame || time-state.lastFrame>=32){
      const delta=state.lastFrame?Math.min(60,time-state.lastFrame):0;
      if(state.scrollDirty)updateScroll();
      state.clock+=delta;
      state.assembly+=(1-state.assembly)*.025;
      state.ambientOpacity+=(state.ambientTarget-state.ambientOpacity)*.075;
      state.ambientScale+=(1-state.ambientScale)*.04;
      state.lastFrame=time;if(state.visible)draw();drawAmbient();
    }
    state.frame=requestAnimationFrame(tick);
  }
  function syncMotion() {
    if(state.scrollDirty)updateScroll();
    if(!mayAnimate()&&state.frame){cancelAnimationFrame(state.frame);state.frame=0;state.lastFrame=0;}
    if(mayAnimate()&&!state.frame)state.frame=requestAnimationFrame(tick);
    if(reduced.matches){state.assembly=1;state.ambientOpacity=0;state.ambientTarget=0;}
    draw();drawAmbient();
  }
  document.querySelector('#sphere-reset').addEventListener('click',()=>{window.closeProjectInline();state.yaw=initial.yaw;state.pitch=initial.pitch;draw();});
  window.addEventListener('scroll',()=>{state.scrollDirty=true;if(!state.frame){updateScroll();syncMotion();}},{passive:true});
  window.addEventListener('resize',()=>{state.scrollDirty=true;resize();},{passive:true});
  stage.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    state.suppressClick=false;
    const target=event.target.closest('.network-node')||canvas;
    event.preventDefault();target.focus({preventScroll:true});target.setPointerCapture(event.pointerId);
    state.dragging={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false,target};
  });
  stage.addEventListener('pointermove',event=>{
    const drag=state.dragging;if(!drag||event.pointerId!==drag.id||event.buttons!==1)return;
    if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>8){
      drag.moved=true;cancelAnimationFrame(state.zoomFrame);state.zoomFrame=0;state.camera={scale:1,x:0,y:0};state.zoomProgress=0;status.textContent='';stage.classList.remove('is-zooming');stage.classList.add('is-dragging');
    }
    if(!drag.moved)return;
    state.yaw+=(event.clientX-drag.x)*.007;state.pitch=clamp(state.pitch+(event.clientY-drag.y)*.006,-1,1);
    drag.x=event.clientX;drag.y=event.clientY;draw();drawAmbient();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>window.addEventListener(name,()=>{
    if(state.dragging)state.suppressClick=state.dragging.moved;
    state.dragging=null;stage.classList.remove('is-dragging');
    // Only suppress the click belonging to this drag, never a later selection.
    setTimeout(()=>{state.suppressClick=false;},0);
  }));
  canvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
    event.preventDefault();
    cancelAnimationFrame(state.zoomFrame);state.zoomFrame=0;state.camera={scale:1,x:0,y:0};state.zoomProgress=0;stage.classList.remove('is-zooming');status.textContent='';
    if(event.key==='Home'){state.yaw=initial.yaw;state.pitch=initial.pitch;}
    if(event.key==='ArrowLeft')state.yaw-=.15;if(event.key==='ArrowRight')state.yaw+=.15;
    if(event.key==='ArrowUp')state.pitch=Math.max(-1,state.pitch-.12);if(event.key==='ArrowDown')state.pitch=Math.min(1,state.pitch+.12);
    draw();
  });
  [previous,next].forEach((button,index)=>button.addEventListener('click',()=>{window.closeProjectInline();state.page+=index?1:-1;renderNodes();}));
  window.addEventListener('arms:project-filter',event=>{window.closeProjectInline();state.items=window.ARMS_PROJECTS.filter(project=>event.detail.filter==='all'||project.related.includes(event.detail.filter));state.page=0;state.active=null;renderNodes();});
  reduced.addEventListener('change',syncMotion);document.addEventListener('visibilitychange',syncMotion);
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);else window.addEventListener('resize',resize);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{const visible=entries[0].isIntersecting;if(visible&&!state.visible&&!reduced.matches)state.assembly=.25;state.visible=visible;syncMotion();},{threshold:.01}).observe(stage);
  resize();renderNodes();syncMotion();
})();
