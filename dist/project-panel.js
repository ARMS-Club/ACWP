(() => {
  'use strict';
  const hero=document.querySelector('.hero');
  const overview=document.querySelector('#hero-overview');
  const panel=document.querySelector('#project-inspector');
  const content=document.querySelector('#project-panel-content');
  const skip=document.querySelector('#typing-skip');
  const announcement=document.querySelector('#project-panel-announcement');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,records=[];
  const animate=()=>!reduced.matches&&!document.hidden;
  const scrollBehavior=()=>animate()?'smooth':'instant';

  // Full text is immediately available to assistive technology. Invisible text
  // reserves the final line height while its visual copy is written in place.
  function typed(tag,text,className='',title=false) {
    const element=document.createElement(tag);element.className=`typed-line ${className}`.trim();
    const reserve=document.createElement('span');reserve.className='typed-reserve';reserve.textContent=text;reserve.setAttribute('aria-hidden','true');
    const visual=document.createElement('span');visual.className='typed-visual';visual.setAttribute('aria-hidden','true');
    const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=text;
    element.append(reserve,visual,accessible);
    records.push({visual,text,duration:title?650:Math.min(850,Math.max(180,text.length*5.5))});
    return element;
  }
  function finishTyping() {
    cancelAnimationFrame(frame);frame=0;
    records.forEach(({visual,text})=>{visual.textContent=text;visual.classList.remove('is-writing');});
    const focused=document.activeElement===skip;
    skip.hidden=true;panel.classList.remove('is-writing');
    if(focused)document.querySelector('#project-panel-title')?.focus({preventScroll:true});
  }
  function startTyping() {
    if(!animate()){finishTyping();return;}
    skip.hidden=false;panel.classList.add('is-writing');
    const start=performance.now();
    function write(time) {
      if(!animate()){finishTyping();return;}
      let elapsed=time-start,complete=true;
      records.forEach(record=>{
        const progress=Math.max(0,Math.min(1,elapsed/record.duration));
        record.visual.textContent=record.text.slice(0,Math.floor(record.text.length*progress));
        record.visual.classList.toggle('is-writing',progress>0&&progress<1);
        if(progress<1)complete=false;
        elapsed-=record.duration;
      });
      if(complete)finishTyping();else frame=requestAnimationFrame(write);
    }
    frame=requestAnimationFrame(write);
  }
  function label(text) {
    const heading=document.createElement('h3');heading.textContent=text;return heading;
  }
  window.showProjectInline=(project,options={})=>{
    cancelAnimationFrame(frame);frame=0;records=[];
    content.replaceChildren();panel.dataset.project=project.id;panel.dataset.area=project.area;
    const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent=`${project.label} / PROJECT CONCEPT`;
    const title=typed('h2',project.title,'inspector-title',true);title.id='project-panel-title';title.tabIndex=-1;
    const description=typed('p',project.description,'inspector-description');
    const first=document.createElement('div');first.className='inspector-first';first.append(label('Your first move'),typed('p',project.first));
    const tasks=document.createElement('ul');tasks.className='inspector-tasks';project.tasks.forEach(task=>tasks.append(typed('li',task)));
    const output=document.createElement('div');output.className='inspector-output';output.append(label('For your portfolio'),typed('p',project.output));
    const skills=typed('p',project.contribution,'inspector-skills');
    const action=document.createElement('button');action.type='button';action.className='button primary inspector-start';action.textContent='Start with this idea';action.addEventListener('click',()=>useProject(project.id));
    const note=document.createElement('p');note.className='inspector-note';note.textContent='A concept to adapt with the club. Agree on scope, resources and support before building.';
    content.append(eyebrow,title,description,first,label('A possible first version'),tasks,output,label('Skills to explore'),skills,action,note);
    overview.hidden=true;panel.hidden=false;hero.classList.add('has-project');hero.setAttribute('aria-labelledby',title.id);
    announcement.textContent=`Project selected: ${project.networkTitle || project.title}. The full brief is available.`;
    startTyping();
    if(innerWidth<=920)panel.scrollIntoView({behavior:scrollBehavior(),block:'start'});
    else if(!options.fromSphere)hero.scrollIntoView({behavior:scrollBehavior(),block:'start'});
    if(!options.fromSphere)title.focus({preventScroll:true});
  };
  window.closeProjectInline=({restoreFocus=false}={})=>{
    cancelAnimationFrame(frame);frame=0;records=[];
    panel.hidden=true;panel.classList.remove('is-writing');skip.hidden=true;overview.hidden=false;
    hero.classList.remove('has-project');hero.setAttribute('aria-labelledby','hero-title');announcement.textContent='';
    window.dispatchEvent(new Event('arms:project-closed'));
    if(restoreFocus){
      const heading=document.querySelector('#hero-title');heading.tabIndex=-1;heading.focus({preventScroll:true});hero.scrollIntoView({behavior:scrollBehavior(),block:'start'});
    }
  };
  document.querySelector('#project-back').addEventListener('click',()=>window.closeProjectInline({restoreFocus:true}));
  skip.addEventListener('click',finishTyping);
  panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();window.closeProjectInline({restoreFocus:true});}});
  reduced.addEventListener('change',()=>{if(reduced.matches)finishTyping();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finishTyping();});
})();
