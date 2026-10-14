/* Repair desk UI. Local fiction only; independent of visitor feedback and v2 personnel saves. */
(function () {
  'use strict';
  function init() {
    const model=window.ChiefRepair,game=window.roastOfficeGame,story=document.getElementById('story');
    if (!model || !game || !story || document.getElementById('repair-desk')) return;
    function el(tag,className,text) {const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
    function add(parent,...nodes) {parent.append(...nodes);return parent;}
    function button(text,fn,primary) {const node=el('button',primary?'primary':'secondary',text);node.type='button';node.addEventListener('click',fn);return node;}
    function today() {return new Date().toISOString().slice(0,10);}
    const panel=el('section','repair');panel.id='repair-desk';panel.hidden=true;panel.setAttribute('aria-labelledby','repair-title');
    const header=el('div','repair__header');
    const badge=el('p','eyebrow','Repair desk / four consequential decisions');
    const title=el('h2','repair__title','A title is nice. Can you close a ticket?');title.id='repair-title';title.tabIndex=-1;
    const chief=el('div','repair__chief');chief.setAttribute('aria-hidden','true');
    // Original code-drawn Chief: paperclip antenna, amber eyes and crooked tie.
    const ns='http://www.w3.org/2000/svg',portrait=document.createElementNS(ns,'svg');portrait.setAttribute('viewBox','0 0 150 155');portrait.setAttribute('focusable','false');
    function shape(tag,attrs) {const node=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))node.setAttribute(k,String(v));portrait.appendChild(node);return node;}
    shape('path',{d:'M72 29V14q0-9 7-9q8 0 8 8v9','stroke':'#443a2b','stroke-width':3,fill:'none'});
    shape('rect',{x:22,y:28,width:107,height:77,rx:20,fill:'#e9dabc',stroke:'#443a2b','stroke-width':3});
    shape('rect',{x:32,y:39,width:87,height:48,rx:12,fill:'#323c39'});
    const left=shape('rect',{x:47,y:54,width:12,height:12,rx:4,fill:'#edbb64'}),right=shape('rect',{x:92,y:54,width:12,height:12,rx:4,fill:'#edbb64'});
    const mouth=shape('path',{d:'M64 76H88',fill:'none',stroke:'#eee3c4','stroke-width':3,'stroke-linecap':'round'});
    shape('path',{d:'M36 153V126q0-15 18-15h45q18 0 18 15v27',fill:'#323c39',stroke:'#443a2b','stroke-width':3});
    shape('path',{d:'M57 111l19 17l20-17',fill:'#f4ecd9'});
    shape('path',{d:'M73 120l8 4l-4 8l9 18l-12 4l-6-20l4-8z',fill:'#bf8743',stroke:'#443a2b','stroke-width':1.5});
    shape('path',{d:'M97 131h10v9q-2 5-8 0zM107 132q10-2 7 6h-6',fill:'#f4ecd9',stroke:'#a48247','stroke-width':2});
    chief.appendChild(portrait);
    add(header,add(el('div'),badge,title),chief);panel.appendChild(header);
    const content=el('div','repair__content');panel.appendChild(content);
    const status=el('p','repair__status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.appendChild(status);
    story.insertAdjacentElement('afterend',panel);
    const reviewActions=document.getElementById('actions'),repairLink=el('a','secondary','Open repair desk · 4 decisions →');repairLink.href='#repair-desk';
    if(reviewActions)reviewActions.appendChild(repairLink);
    let file={version:1,current:null,completed:[]},source=null,storageOK=true,loadMessage='',core=null;
    try {
      const raw=localStorage.getItem(model.storageKey);
      if(raw){const parsed=JSON.parse(raw);if(parsed.version!==1 || !Array.isArray(parsed.completed)||parsed.completed.length>7)throw Error('Invalid repair archive');
        file={version:1,current:parsed.current?model.validate(parsed.current):null,completed:parsed.completed.map(item=>{const saved=model.validate(item);if(saved.stage!=='result')throw Error('Invalid receipt');return saved;})};}
    } catch (_) {storageOK=false;loadMessage='The repair file could not be opened. This repair can be played on this page; local saving has not been confirmed.';}
    function save() {try{localStorage.setItem(model.storageKey,JSON.stringify(file));storageOK=true;}catch(_){storageOK=false;}}
    function speak(mood) {panel.dataset.mood=mood;mouth.setAttribute('d',mood==='filed'?'M62 73q13 11 28 0':mood==='open'?'M63 79q13-9 27 0':'M64 76H88');left.setAttribute('height',mood==='filed'?8:12);right.setAttribute('height',mood==='open'?6:12);}
    function commit(next) {const previous=file.current;file.current=next;
      if(next.stage==='result' && (!previous || previous.stage!=='result')){file.completed.push(next);file.completed=file.completed.slice(-7);}
      save();render(true);
    }
    function start() {if(!source)return;commit(model.advance(model.create(source,today())));}
    function stats(c) {
      const dl=el('dl','repair__stats');
      for(const [name,value]of [['Minutes left',c.minutes],['Working steps',c.work],['Passing test',c.test],['Office noise',c.noise]])add(dl,add(el('div'),el('dt','',name),el('dd','',String(value))));
      return dl;
    }
    function capability(c) {return el('p','repair__capability','Brief: '+(c.clarity?'clear':'missing')+' · Evidence: '+(c.evidence?'on file':'missing')+' · Intern: '+(c.intern?'trusted':'needs a boundary')+' · Receipt: '+(c.receipt?'filed':'pending'));}
    function render(focus) {
      content.replaceChildren();status.textContent=loadMessage;loadMessage='';
      const current=file.current;
      speak('thinking');
      if(!current) {
        const c=model.context(source),order=model.orderFor(today());
        add(content,el('p','repair__date','Today’s work order · '+today()+' · changes daily at 00:00 UTC'),el('h3','',order.name),el('p','scene-copy',order.fault),el('p','repair__chief-line','Chief: “'+order.chief+'”'));
        const list=el('ul','repair__inherited');for(const line of c.inherited)list.appendChild(el('li','',line));
        add(content,list,el('p','repair__rule','Goal: repair a step, pass the appropriate test, and leave a receipt before the minutes run out. Your earlier decisions change the starting conditions and available choices.'),button('Open the repair desk · 4 decisions',start,true));
      } else {
        const c=model.condition(current),order=model.orderFor(current.date);
        add(content,el('p','repair__date','Work order · '+current.date+(current.date!==today()?' · saved from an earlier day':'')),el('h3','',order.name),el('p','scene-copy',order.fault),stats(c),capability(c));
        if(current.stage==='welcome')add(content,button('Continue this saved work order',()=>commit(model.advance(current)),true));
        if(current.stage==='question') {
          const count=current.answers.length;
          const heading=el('h4','repair__question',['1. Recover the brief','2. Make the repair','3. Test what changed','4. Leave the next operator a receipt'][count]);heading.tabIndex=-1;
          const choices=el('div','options');
          for(const option of model.options(current)) {
            const choice=button('',()=>commit(model.choose(current,option.id)));choice.className='choice';choice.dataset.repairChoice=option.id;choice.disabled=!option.enabled;
            add(choice,el('strong','',option.label),el('span','',option.cost+' minute'+(option.cost===1?'':'s')+' · '+option.detail));
            if(option.blocked)add(choice,el('span','repair__blocked','Unavailable: '+option.blocked));
            choices.appendChild(choice);
          }
          add(content,heading,choices,el('p','repair__rule','Noise limit for a passing test: '+order.limit+'. A disabled choice shows which earlier condition is missing.'));
        }
        if(current.stage==='feedback') {
          const reply=model.feedback(current);speak(reply.condition.test?'filed':current.answers.at(-1)==='announce'?'open':'thinking');
          add(content,el('h4','repair__question','Decision '+current.answers.length+' filed'),el('p','repair__consequence',reply.result),el('p','repair__chief-line','Chief: “'+reply.chief+'”'),button(current.answers.length===4?'Close the repair desk. Read the receipt.':'Next decision →',()=>commit(model.advance(current)),true));
        }
        if(current.stage==='result') {
          const result=model.outcome(current);speak(result.closed?'filed':'open');
          add(content,el('p','repair__stamp',result.stamp),el('h4','repair__question',result.title),el('p','repair__consequence',result.copy),el('p','repair__chief-line','Chief: “'+result.chief+'”'),el('p','repair__ticket',result.returnTicket));
          const actions=el('div','actions');
          add(actions,button(current.date===today()?'Try today’s repair with your latest shift decisions':'Open today’s new work order',start,true),button('Copy repair receipt',async()=>{const text=model.receiptText(current);try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(text);status.textContent='Repair receipt copied. You choose where to share it.';}catch(_){const box=el('textarea','copy-fallback');box.readOnly=true;box.setAttribute('aria-label','Repair receipt text to copy');box.value=text;content.appendChild(box);box.focus();box.select();status.textContent='Copy the selected repair receipt.';}}));content.appendChild(actions);
          const closed=file.completed.filter(item=>model.outcome(item).closed).length;
          add(content,el('p','repair__rule',closed+' verified repair'+(closed===1?'':'s')+' in the last '+file.completed.length+' local receipt'+(file.completed.length===1?'':'s')+'. Replaying creates another receipt; this is a fictional local ledger.'));
          if(file.completed.length>1) {
            const archive=el('details','repair__archive');archive.appendChild(el('summary','','Recent repair receipts in this browser'));
            const list=el('ul');for(const item of file.completed.slice().reverse())list.appendChild(el('li','',item.date+' · '+model.orderFor(item.date).name+' · '+model.outcome(item).stamp));archive.appendChild(list);content.appendChild(archive);
          }
        }
      }
      add(content,el('p','privacy',storageOK?'Repair choices and up to seven receipts stay in this browser. Clear local file also clears this desk.':'Local saving is unavailable. The repair works until this page closes.'));
      if(focus){const target=content.querySelector('.repair__question')||title;target.tabIndex=-1;target.focus();}
    }
    function update(next) {
      core=next || (typeof game.getState==='function'?game.getState():null);
      try{source=model.sourceFrom(core);}catch(_){source=null;}
      panel.hidden=!source || core.stage!=='result';
      repairLink.hidden=panel.hidden;
      repairLink.textContent=file.current&&file.current.stage!=='result'?'Continue the saved repair desk →':'Open repair desk · 4 decisions →';
      if(source&&!panel.hidden)render(false);
    }
    document.addEventListener('chief:shift-render',event=>update(event.detail));
    document.addEventListener('chief:local-clear',event=>{let cleared=false;try{localStorage.removeItem(model.storageKey);cleared=localStorage.getItem(model.storageKey)===null;}catch(_){}if(event.detail)event.detail.repairCleared=cleared;file={version:1,current:null,completed:[]};source=null;panel.hidden=true;status.textContent='';storageOK=cleared;});
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
