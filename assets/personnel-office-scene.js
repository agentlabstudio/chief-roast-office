/* Original office miniature, driven only by the personnel game's visible DOM. */
(function () {
  'use strict';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function init() {
    if (document.getElementById('chief-stage__office-scene')) return;
    const intro = document.querySelector('.intro');
    const grid = document.querySelector('.grid');
    const form = document.getElementById('review-form');
    const paper = document.getElementById('paper');
    if (!intro || !grid || !form || !paper || intro.parentNode !== grid.parentNode) return;

    function html(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function svg(tag, attributes, text) {
      const node = document.createElementNS(SVG_NS, tag);
      for (const [name, value] of Object.entries(attributes || {})) node.setAttribute(name, String(value));
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function append(parent) {
      for (let i = 1; i < arguments.length; i++) parent.appendChild(arguments[i]);
      return parent;
    }
    function rect(x,y,width,height,fill,extra) { return svg('rect',{x,y,width,height,fill,...extra}); }
    function line(x1,y1,x2,y2,stroke,extra) { return svg('line',{x1,y1,x2,y2,stroke,'stroke-width':2,'stroke-linecap':'round',...extra}); }
    function path(d,fill,stroke,extra) { return svg('path',{d,fill:fill||'none',stroke:stroke||'#443a2b','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round',...extra}); }
    function group(name) { return svg('g',{id:'chief-stage__'+name,class:'chief-stage__target chief-stage__'+name,'data-active':'false'}); }
    const cream='#f4ecd9',paperColor='#fffaf0',ink='#443a2b',muted='#b5a488',amber='#dea34b',dark='#323c39';
    const figure = html('figure','chief-stage__figure');
    figure.id = 'chief-stage__office-scene';
    figure.setAttribute('data-chief-stage','personnel-office-v1');
    const illustration = svg('svg',{class:'chief-stage__illustration',viewBox:'0 0 760 300','aria-hidden':'true',focusable:'false'});
    append(illustration,
      rect(0,0,760,300,cream,{rx:5}),
      rect(0,248,760,52,'#e4d4b4'),
      line(24,248,736,248,'#c9b894',{ 'stroke-width':1 }),
      line(24,280,735,280,'#cdbb9b',{ 'stroke-width':1 }),
      line(430,251,486,297,'#d5c3a3',{ 'stroke-width':1 }),
      line(103,251,47,297,'#d5c3a3',{ 'stroke-width':1 }));

    const visitor=group('visitor');
    append(visitor,rect(30,30,108,210,'#e3d4b6',{rx:8,stroke:ink,'stroke-width':2,class:'chief-stage__outline'}),
      rect(42,44,84,84,'#fff8e6',{rx:5,stroke:muted}),line(84,45,84,127,'#d1bfa0'),
      rect(51,155,68,7,'#bfa981',{rx:3}),svg('circle',{cx:119,cy:181,r:4,fill:amber,stroke:ink}),
      svg('text',{x:84,y:96,'text-anchor':'middle',fill:'#857252',class:'chief-stage__svg-label'},'OFFICE'),
      path('M24 246H145L157 257H16Z','#ae9870','#ae9870'));
    append(illustration,visitor);

    const board=group('board');
    append(board,rect(499,26,216,108,'#c9ad76',{rx:5,stroke:ink,'stroke-width':2,class:'chief-stage__outline'}),
      rect(507,34,200,92,'#dcc59b',{rx:2}),
      svg('text',{x:518,y:51,fill:ink,class:'chief-stage__svg-label'},'SHIFT NOTES'),
      rect(519,61,46,33,paperColor,{transform:'rotate(-5 542 77)'}),
      rect(577,60,44,34,'#f6dea9',{transform:'rotate(3 599 77)'}),
      rect(634,59,51,35,paperColor,{transform:'rotate(-2 660 77)'}),
      line(525,69,555,69,'#b7a788',{ 'stroke-width':1 }),line(525,76,550,76,'#b7a788',{ 'stroke-width':1 }),
      line(583,69,613,69,'#ba9759',{ 'stroke-width':1 }),line(583,76,605,76,'#ba9759',{ 'stroke-width':1 }),
      line(641,68,676,68,'#b7a788',{ 'stroke-width':1 }),line(641,76,670,76,'#b7a788',{ 'stroke-width':1 }));
    const bubbles=[];
    for(let i=0;i<6;i++){
      const bubble=svg('circle',{cx:531+i*29,cy:111,r:5,fill:'#e9d7b5',stroke:'#9b8256','stroke-width':1,'data-chief-stage-filed':i+1});
      bubbles.push(bubble);append(board,bubble);
    }
    append(illustration,board);

    const chair=group('intern');
    append(chair,rect(71,159,76,59,'#98a296',{rx:12,stroke:ink,'stroke-width':2,class:'chief-stage__outline'}),
      rect(65,211,89,15,'#78877b',{rx:5,stroke:ink,'stroke-width':2}),
      line(80,227,71,260,ink,{ 'stroke-width':4 }),line(137,227,145,260,ink,{ 'stroke-width':4 }),
      line(68,260,86,260,ink,{ 'stroke-width':3 }),line(131,260,151,260,ink,{ 'stroke-width':3 }),
      rect(87,174,45,17,'#e9dfc5',{rx:3}),svg('text',{x:109,y:186,'text-anchor':'middle',fill:ink,class:'chief-stage__svg-label'},'INTERN'));
    append(illustration,chair);

    const chief=svg('g',{id:'chief-stage__chief',class:'chief-stage__chief','data-speaking':'false'});
    append(chief,line(268,62,268,79,ink,{ 'stroke-width':3 }),svg('circle',{cx:268,cy:58,r:5,fill:amber,stroke:ink,'stroke-width':2}),
      rect(209,78,117,84,'#efe4c9',{rx:19,stroke:ink,'stroke-width':3}),
      rect(221,90,93,52,dark,{rx:12}),
      rect(238,106,12,12,'#e9be6b',{rx:4}),rect(285,106,12,12,'#e9be6b',{rx:4}),
      line(256,128,279,128,'#d5d0ac',{ 'stroke-width':3 }),
      rect(199,109,10,26,'#c3b28f',{rx:4,stroke:ink}),rect(326,109,10,26,'#c3b28f',{rx:4,stroke:ink}),
      rect(228,167,83,48,dark,{rx:13,stroke:ink,'stroke-width':2}),
      path('M249 167L269 185L290 167',cream,cream),
      rect(284,190,15,6,'#ac8b52',{rx:2,class:'chief-stage__lamp'}),
      path('M228 181Q200 181 194 207L222 207',cream,ink,{'stroke-width':5}),
      path('M311 181Q337 180 348 204L324 207',cream,ink,{'stroke-width':5}));
    append(illustration,chief);

    const desk=group('desk');
    append(desk,rect(168,211,349,17,'#a98450',{rx:5,stroke:ink,'stroke-width':2,class:'chief-stage__outline'}),
      rect(181,228,18,42,'#937148'),rect(483,228,18,42,'#937148'),
      rect(210,235,245,10,'#c1a576',{rx:3}),line(330,241,341,241,ink,{ 'stroke-width':2 }),
      path('M343 207L364 180L405 205Z',paperColor,'#ac9a77'),line(365,191,390,202,'#bda983',{ 'stroke-width':1 }),
      line(337,209,364,209,ink,{ 'stroke-width':3 }));
    append(illustration,desk);

    const coffee=svg('g',{class:'chief-stage__coffee'});
    append(coffee,svg('ellipse',{cx:306,cy:210,rx:28,ry:4,fill:'#c8b189'}),
      path('M312 189H322Q336 190 334 199Q331 207 318 203','none',ink,{ 'stroke-width':3 }),
      path('M290 185H317V201Q315 210 303 210Q291 209 290 201Z',paperColor,ink),
      svg('ellipse',{cx:303,cy:185,rx:13,ry:4,fill:'#94734c',stroke:ink,'stroke-width':2}),
      path('M298 175Q292 167 298 159','none','#b9a17a',{class:'chief-stage__steam'}),
      path('M309 174Q315 166 309 156','none','#b9a17a',{class:'chief-stage__steam'}));
    append(illustration,coffee);

    const tray=group('handover');
    const sheets=[];
    for(let i=0;i<6;i++){
      const sheet=rect(409+i%2*2,209-i*4,85,4,paperColor,{rx:1,stroke:'#a68e64','stroke-width':1,visibility:'hidden','data-chief-stage-sheet':i+1});
      sheets.push(sheet);append(tray,sheet);
    }
    append(tray,path('M402 210H501L509 225H397Z','#c1a16c',ink,{class:'chief-stage__outline'}),
      line(409,217,496,217,'#eee2c8',{ 'stroke-width':2 }));
    append(illustration,tray);

    const printer=group('printer');
    append(printer,rect(569,165,138,77,'#c2c8b9',{rx:12,stroke:ink,'stroke-width':2,class:'chief-stage__outline'}),
      rect(580,153,116,33,'#ebe5d2',{rx:6,stroke:ink,'stroke-width':2}),
      path('M601 155L597 123L629 125L634 139L649 126L675 131L681 155',paperColor,ink),
      line(606,132,622,135,'#b6a17d',{ 'stroke-width':1 }),line(652,137,670,141,'#b6a17d',{ 'stroke-width':1 }),
      rect(582,192,111,12,dark,{rx:3}),path('M604 203H675L688 228H594Z',paperColor,ink),
      line(609,211,669,211,'#b6a17d',{ 'stroke-width':1 }),line(610,216,657,216,'#b6a17d',{ 'stroke-width':1 }),
      svg('circle',{cx:687,cy:177,r:4,fill:amber,stroke:ink}),
      rect(586,230,105,11,'#b1b9a8',{rx:2}),svg('text',{x:638,y:237,'text-anchor':'middle',fill:ink,class:'chief-stage__svg-label'},'PRINTER'));
    append(illustration,printer);

    const stamp=svg('g',{id:'chief-stage__review-stamp',class:'chief-stage__review-stamp',visibility:'hidden',transform:'rotate(-12 463 179)'});
    append(stamp,rect(426,166,74,27,'#f5dea9',{rx:3,stroke:'#8b6230','stroke-width':2}),
      svg('text',{x:463,y:184,'text-anchor':'middle',fill:'#8b6230',class:'chief-stage__svg-stamp'},'FILED'));
    append(illustration,stamp);

    const caption=html('figcaption','chief-stage__caption');
    const room=html('p','chief-stage__room');
    const title=html('h2','chief-stage__title');
    const progressText=html('p','chief-stage__progress');
    const chiefLine=html('p','chief-stage__reply');
    const stampText=html('p','chief-stage__stamp');
    append(caption,room,title,progressText,chiefLine,stampText);
    append(figure,illustration,caption);
    grid.parentNode.insertBefore(figure,grid);

    const roots=[form,paper];
    function node(id){const found=document.getElementById(id);return found&&roots.some(root=>root.contains(found))?found:null;}
    function visible(found){
      if(!found)return false;
      for(let current=found;current&&current!==document.body;current=current.parentElement){
        if(current.hidden||current.getAttribute('aria-hidden')==='true')return false;
      }
      return true;
    }
    function read(id,limit){const found=node(id);if(!visible(found))return '';const text=String(found.textContent||'').trim();return text.length>limit?text.slice(0,limit-1)+'…':text;}
    function snapshot(){
      const shift=read('shift-label',80);
      const bar=node('shift-progress');
      const count=bar&&visible(bar)?Number(bar.value):NaN;
      const max=bar&&visible(bar)?Number(bar.max):NaN;
      const valid=Number.isInteger(count)&&count>=0&&(max===6||max===5)&&count<=max;
      return {shift,phase:/\breturn\b/i.test(shift)?'return':/\bopening\b/i.test(shift)?'opening':'unknown',
        count:valid?count:null,max:valid?max:null,
        progress:read('progress',90),title:read('scene-heading',180)||read('feedback-heading',180)||read('welcome-heading',180)||read('end-heading',180),
        reply:read('chief-feedback',260),stamp:read('stamp',140)};
    }
    function textIfChanged(target,text){if(target.textContent!==text)target.textContent=text;}
    function attributeIfChanged(target,name,value){const string=String(value);if(target.getAttribute(name)!==string)target.setAttribute(name,string);}
    let previous='';
    function update(){
      const state=snapshot(),signature=JSON.stringify(state);
      if(signature===previous)return;
      previous=signature;
      textIfChanged(room,state.shift||'Personnel office');
      textIfChanged(title,state.title||'The office follows the visible shift.');
      textIfChanged(progressText,state.progress||(state.count!==null?state.count+' / '+state.max+' decisions filed':'Progress is not currently displayed.'));
      textIfChanged(chiefLine,state.reply);
      chiefLine.hidden=!state.reply;
      textIfChanged(stampText,state.stamp?'Review stamp · '+state.stamp:'');
      stampText.hidden=!state.stamp;
      attributeIfChanged(figure,'data-shift',state.phase);
      attributeIfChanged(chief,'data-speaking',Boolean(state.reply));
      attributeIfChanged(stamp,'visibility',state.stamp?'visible':'hidden');
      for(let i=0;i<6;i++){
        attributeIfChanged(sheets[i],'visibility',state.count!==null&&i<state.count?'visible':'hidden');
        attributeIfChanged(bubbles[i],'fill',state.count!==null&&i<state.count?amber:'#e9d7b5');
        attributeIfChanged(bubbles[i],'visibility',state.max===5&&i===5?'hidden':'visible');
      }
      const matches={printer:/\bprinter\b/i.test(state.title),intern:/\bintern\b/i.test(state.title),handover:/\b(handover|keys)\b/i.test(state.title),visitor:/\bvisitor\b/i.test(state.title),board:/\b(notice|questions?|review|correction)\b/i.test(state.title)};
      for(const [key,target]of Object.entries({printer,intern:chair,handover:tray,visitor,board}))attributeIfChanged(target,'data-active',matches[key]);
      attributeIfChanged(desk,'data-active',matches.handover);
    }
    update();

    if(typeof window.MutationObserver!=='function')return;
    const relevantIds=new Set(['shift-label','progress','shift-progress','scene-heading','feedback-heading','chief-feedback','stamp','welcome-heading','end-heading']);
    const visibilityIds=new Set(['review-form','paper','welcome','decision','feedback','shift-end','report']);
    function relevant(record){
      let target=record.target.nodeType===3?record.target.parentElement:record.target;
      if(roots.includes(target)&&record.type==='childList')return true;
      if(record.type==='attributes'&&visibilityIds.has(target.id))return true;
      while(target&&!roots.includes(target)){if(relevantIds.has(target.id))return true;target=target.parentElement;}
      return false;
    }
    let queued=false;
    const observer=new window.MutationObserver(function(records){
      if(queued||!records.some(relevant))return;
      queued=true;
      Promise.resolve().then(function(){queued=false;update();});
    });
    for(const root of roots)observer.observe(root,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['hidden','value','max','aria-hidden']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
