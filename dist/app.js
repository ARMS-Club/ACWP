const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
menu.addEventListener('click', () => { const expanded = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', String(!expanded)); menu.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation'); nav.classList.toggle('open', !expanded); });
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); nav.classList.remove('open'); }));

const config = window.CLUB_CONFIG;
const areas = {supply:'Supply chain management',robotics:'Automation & robotics',mechanical:'Mechanical engineering',exploring:'Still exploring / related program'};
const projects = window.ARMS_PROJECTS;
let currentFilter = 'all';
let currentStep = 0;
let chosenProject = null;
let currentDraft = '';
const grid = document.querySelector('#project-grid');
function renderProjects(filter) {
  if (!['all','supply','robotics','mechanical'].includes(filter)) throw new Error('Choose a valid discipline.');
  const visible = projects.filter(p => filter === 'all' || p.related.includes(filter));
  currentFilter = filter;
  document.querySelectorAll('.filter').forEach(button => {const active = button.dataset.filter === filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  grid.innerHTML = visible.map((p,i) => `<article class="project-card" data-area="${p.area}"><div class="card-top"><span>${p.label}</span><span class="card-number">0${i+1}</span></div><div class="flow-diagram" aria-label="Concept workflow: ${p.flow.join(', ')}">${p.flow.map((node,j)=>`${j?'<span class="flow-connector" aria-hidden="true"></span>':''}<span class="flow-node">${node}</span>`).join('')}</div><h3>${p.title}</h3><p>${p.description}</p><span class="card-meta">${p.entry}</span><button class="card-button" data-project="${p.id}" aria-label="Explore project: ${p.title}">Explore this idea<span class="plus" aria-hidden="true">+</span></button></article>`).join('');
  document.querySelector('#project-count').textContent = `${visible.length} starting points to explore · project concepts`;
  window.dispatchEvent(new CustomEvent('arms:project-filter', {detail:{filter}}));
  return visible.map(p=>({id:p.id,title:p.title}));
}
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>renderProjects(button.dataset.filter)));
grid.addEventListener('click',event=>{const button=event.target.closest('[data-project]');if(button)openProject(button.dataset.project);});
function openProject(id,options={}) {
  const p = projects.find(p=>p.id===id);
  if (!p) throw new Error('Project concept not found.');
  window.showProjectInline(p,options);
  if(!options.fromSphere)window.dispatchEvent(new CustomEvent('arms:project-selected',{detail:{id:p.id}}));
  return {id:p.id,title:p.title};
}
function useProject(id) {
  const p=projects.find(p=>p.id===id);if(!p)throw new Error('Project concept not found.');
  chosenProject=p;
  document.querySelector('#student-program').value=p.area;
  document.querySelector('#student-idea').value=`I’d like to explore: ${p.title}\nMy first step could be: ${p.first}`;
  document.querySelector('#student-idea').setCustomValidity('');
  showForm();window.closeProjectInline({restoreFocus:false});document.querySelector('#join').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  document.querySelector('#student-idea').focus({preventScroll:true});
  return {project:p.id,program:p.area};
}
const steps=[
  {title:'Make the question specific.',text:'Choose one problem you can investigate. A clear, manageable question gives your project direction.',items:['Describe who experiences the problem.','Define one result you want to understand or improve.','Agree on a scope that fits your time and resources.'],capture:'KEEP: your problem statement, assumptions, and first sketch.'},
  {title:'Build something you can learn from.',text:'A first version can be a spreadsheet, a CAD model, a flowchart, or a simulation. Choose the smallest version that lets you test an idea.',items:['List the inputs, tools, and collaborators you need.','Record why you chose this approach.','Keep versions so you can show how the idea developed.'],capture:'KEEP: drawings, model files, logic, and your design decisions.'},
  {title:'Let the evidence guide you.',text:'Define a simple test and compare the result with your expectations. An unexpected result can be the most useful part of the project.',items:['Write down what you will measure or observe.','Document what worked and what needs to change.','Try a revision and explain what you learned.'],capture:'KEEP: test setup, observations, revisions, and limitations.'},
  {title:'Show your contribution clearly.',text:'Help someone understand the project, the decisions behind it, and the part you personally contributed.',items:['Explain the problem and your role in a few sentences.','Show selected visuals and evidence of the result.','Credit collaborators and state what you would do next.'],capture:'KEEP: a concise case study, a demonstration, and a reflection.'}
];
function renderStep(index) {
  if(!Number.isInteger(index)||index<0||index>=steps.length)throw new Error('Choose a valid portfolio step.');
  currentStep=index;const step=steps[index];
  document.querySelectorAll('.path-tab').forEach((tab,i)=>{tab.classList.toggle('active',i===index);tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
  const panel=document.querySelector('#step-panel');panel.setAttribute('aria-labelledby',`step-tab-${index}`);
  panel.innerHTML=`<p class="eyebrow">STEP 0${index+1} / YOUR PROJECT RECORD</p><h3>${step.title}</h3><p>${step.text}</p><ul>${step.items.map(t=>`<li>${t}</li>`).join('')}</ul><p class="capture">${step.capture}</p>`;
  return {step:index+1,title:step.title};
}
document.querySelectorAll('.path-tab').forEach(tab=>{tab.addEventListener('click',()=>renderStep(Number(tab.dataset.step)));tab.addEventListener('keydown',e=>{let next=currentStep;if(e.key==='ArrowDown'||e.key==='ArrowRight')next=(next+1)%4;else if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=(next+3)%4;else if(e.key==='Home')next=0;else if(e.key==='End')next=3;else return;e.preventDefault();renderStep(next);document.querySelector(`#step-tab-${next}`).focus();});});
const form=document.querySelector('#intro-form');
const result=document.querySelector('#intro-result');
function createIntro(input) {
  const name=typeof input.name==='string'?input.name.trim():'';
  const idea=typeof input.idea==='string'?input.idea.trim():'';
  if(name.length>80||!idea||idea.length>1600||!Object.hasOwn(areas,input.program))throw new Error('Choose an area and describe your idea in 1–1600 characters.');
  document.querySelector('#student-name').value=name;
  document.querySelector('#student-program').value=input.program;
  document.querySelector('#student-idea').value=idea;
  currentDraft=`Hello ${config.name},\n\n${name?`My name is ${name}. `:''}I’m interested in joining the club and exploring ${areas[input.program].toLowerCase()}.\n\nMy idea or learning goal:\n${idea}\n\n${chosenProject&&idea.includes(chosenProject.title)?`A possible portfolio outcome:\n${chosenProject.output}\n\n`:''}I’d like to discuss a manageable first step, opportunities to collaborate, and how to document my contribution.\n\nCould you share how I can get involved?${name?`\n\n${name}`:''}`;
  document.querySelector('#intro-text').textContent=currentDraft;
  document.querySelector('#copy-status').textContent='';
  const email=document.querySelector('#email-intro');
  if(config.email){email.href=`mailto:${config.email}?subject=${encodeURIComponent('Interested in joining ARMS')}&body=${encodeURIComponent(currentDraft)}`;email.hidden=false;}
  form.hidden=true;result.hidden=false;
  return {status:'draft_prepared',program:input.program,text:currentDraft,sent:false};
}
form.addEventListener('submit',event=>{event.preventDefault();const idea=document.querySelector('#student-idea');if(!idea.value.trim()){idea.setCustomValidity('Describe an idea or something you would like to learn.');idea.reportValidity();return;}createIntro({name:document.querySelector('#student-name').value,program:document.querySelector('#student-program').value,idea:idea.value});document.querySelector('#copy-intro').focus();});
document.querySelector('#student-idea').addEventListener('input',event=>event.target.setCustomValidity(''));
function showForm(){form.hidden=false;result.hidden=true;}
document.querySelector('#edit-intro').addEventListener('click',()=>{showForm();document.querySelector('#student-idea').focus();});
document.querySelector('#copy-intro').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentDraft);document.querySelector('#copy-status').textContent='Copied. Your introduction is ready to share.';}catch{const selection=window.getSelection();const range=document.createRange();range.selectNodeContents(document.querySelector('#intro-text'));selection.removeAllRanges();selection.addRange(range);document.querySelector('#copy-status').textContent='Select and copy the text above, or download your brief.';}});
document.querySelector('#download-intro').addEventListener('click',()=>{const text=`ARMS / YOUR PROJECT INTRODUCTION\n\n${currentDraft}\n\nPROJECT-TO-PORTFOLIO CHECKLIST\n1. Define the problem and assumptions.\n2. Record your first version and design decisions.\n3. Keep test evidence and explain revisions.\n4. Show your role, credit collaborators, and reflect on next steps.\n\nClub contact: ${config.email}\n`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='ARMS-project-introduction.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('#copy-status').textContent='Your brief was prepared for download.';});
function addContact(label,url){const a=document.createElement('a');a.textContent=label;a.href=url;if(url.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',`${label} (opens in a new tab)`);}document.querySelector('#contact-links').append(a);}
if(config.email)addContact('Email ARMS',`mailto:${config.email}`);
for(const [key,label] of [['instagram','Instagram'],['linkedin','LinkedIn']]){try{const url=new URL(config[key]);if(url.protocol==='https:')addContact(label,url.href);}catch{}}
document.querySelector('#contact-links').hidden=!document.querySelector('#contact-links').children.length;
renderProjects('all');renderStep(0);

if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  register({name:'filter_project_concepts',title:'Explore project concepts',description:'Filter the visible project concept cards by discipline. Does not join the club or submit information.',inputSchema:{type:'object',properties:{discipline:{type:'string',enum:['all','supply','robotics','mechanical']}},required:['discipline'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>({discipline:input.discipline,projects:renderProjects(input.discipline)})});
  register({name:'prepare_club_introduction',title:'Prepare an ARMS introduction',description:'Prepare and display a local introduction draft to the club. Does not send email, store an application, or register membership.',inputSchema:{type:'object',properties:{name:{type:'string',maxLength:80},program:{type:'string',enum:['supply','robotics','mechanical','exploring']},idea:{type:'string',minLength:1,maxLength:1600}},required:['program','idea'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:input=>createIntro(input)});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
