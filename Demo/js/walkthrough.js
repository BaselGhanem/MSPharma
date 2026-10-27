(function walkthrough(){
 "use strict";
 if(typeof SF_GUIDE_STEPS==="undefined" || !window.SP?.store)return;
 const STEPS=SF_GUIDE_STEPS,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const state=()=>SP.store.get(),plan=()=>state().plans.find(x=>x.demandId==="DEM-1001"&&x.status!=="CANCELLED");
 const root=$("#sf-tour"),card=$("#sf-tour-card"),spot=$("#sf-tour-spotlight"),shade=$("#sf-tour-shade"),drawer=$("#sf-tour-drawer");
 let current=0,active=true,drawerOpen=false,moving=false,focus=null,drag=null,manualPosition=false;
 const safe=s=>String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
 const click=s=>{const x=$(s);if(!x)return false;x.click();return true;};
 const dialog=()=>$("#modal.open .dialog");
 const close=()=>{if(dialog())click("#modal [data-action='close-modal']");};
 const page=id=>{
   if(!id)return;
   if($(".nav-link.active[data-page]")?.dataset.page!==id){close();click(`[data-page="${id}"]`);}
   $(".sidebar.mobile-open")?.classList.remove("mobile-open");
   $("#mobile-backdrop.visible")?.classList.remove("visible");
 };
 const tab=id=>{if(!$(`[data-master="${id}"].active`))click(`[data-master="${id}"]`);};
 const chooseDemand=()=>{
   const select=$("[data-form='plan'] [name='demandId']");
   if(select&&[...select.options].some(o=>o.value==="DEM-1001")){
     select.value="DEM-1001";
     select.dispatchEvent(new Event("change",{bubbles:true}));
   }
 };
 const planForm=()=>{
   if(plan()){close();return;}
   if(!dialog()?.querySelector("[data-form='plan']")){close();click("[data-action='add-plan']");}
   chooseDemand();
 };
 const createPlan=()=>{
   if(plan()){close();return true;}
   page("mps");planForm();
   const f=$("[data-form='plan']");
   if(!f)return false;
   chooseDemand();f.requestSubmit();
   return !!plan();
 };
 const details=()=>{
   if(!plan())return false;
   page("mps");
   if(dialog()?.querySelector(".plan-details"))return true;
   close();return click(`[data-action="view-plan"][data-id="${CSS.escape(plan().id)}"]`);
 };
 function setup(s){
   const contextual=["openDemand","keepDemand","openImport","openPlan","keepPlan","openDetails","keepDetails","openBOM","openRouting"];
   if(!contextual.includes(s.setup))close();
   page(s.page);
   switch(s.setup){
     case "openDemand":case "keepDemand":
       if(!dialog()?.querySelector("[data-form='demand']")){close();click("[data-action='add-demand']");}
       break;
     case "openImport":
       if(!dialog()?.querySelector(".import-panel")){close();click("[data-action='open-import']");}
       break;
     case "openPlan":case "keepPlan":planForm();break;
     case "createdPlan":close();break;
     case "openDetails":case "keepDetails":details();break;
     case "masterProducts":case "masterMaterials":case "masterLines":case "masterSettings":
       close();page("master");
       tab({masterProducts:"products",masterMaterials:"materials",masterLines:"lines",masterSettings:"settings"}[s.setup]);break;
     case "openBOM":case "openRouting":
       close();page("master");tab("products");
       click(s.setup==="openBOM"?"[data-action='edit-bom']":"[data-action='edit-routing']");break;
   }
 }
 const target=s=>s.selector==="@materials"?$$(".plan-details .modal-section")[0]:s.selector==="@routing"?$$(".plan-details .modal-section")[1]:s.selector?$(s.selector):null;
 const contents=()=>{
   $("#sf-tour-drawer-list").innerHTML=STEPS.map((s,i)=>`<button data-go="${i}" class="${i===current?"is-current":""}"><b>${String(i+1).padStart(2,"0")}</b><span><strong>${safe(s.title)}</strong><small>${safe(s.chapter)}</small></span></button>`).join("");
 };

 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const targetRect=element=>{
   let rect=element.getBoundingClientRect();
   // Very wide elements are represented by the actual key information inside them.
   // This prevents a large table or full-width banner from hiding its own content.
   if(rect.width>innerWidth*.70){
     let inner=null;
     if(element.matches(".attention-box"))inner=element.querySelector("strong");
     else if(element.matches(".page-intro"))inner=element.querySelector("h1");
     else if(element.matches(".metric-grid"))inner=element.querySelector(".metric-card");
     else if(element.matches(".table-wrap"))inner=element.querySelector("tbody tr:first-child td:first-child");
     else if(element.matches(".workflow-ribbon"))inner=element.querySelector("div:first-child");
     else if(element.matches(".five-constraints"))inner=element.querySelector(".constraint-item:first-child");
     else if(element.matches(".procurement-summary"))inner=element.querySelector(".proc-highlight");
     if(inner){
       const candidate=inner.getBoundingClientRect();
       if(candidate.width>0&&candidate.height>0)rect=candidate;
     }
   }
   return rect;
 };
 const move=()=>{
   if(!active||drawerOpen||drag)return;
   const element=target(STEPS[current]);focus=element;
   if(!element||!element.isConnected){
     if(manualPosition){
       root.classList.remove("sf-tour-center");
       root.classList.add("sf-tour-focused");
       card.style.left=clamp(parseFloat(card.style.left)||12,12,Math.max(12,innerWidth-card.offsetWidth-12))+"px";
       card.style.top=clamp(parseFloat(card.style.top)||12,12,Math.max(12,innerHeight-card.offsetHeight-12))+"px";
     }else{
       root.classList.add("sf-tour-center");
       root.classList.remove("sf-tour-focused");
       ["top","left","right","bottom","width"].forEach(p=>card.style.removeProperty(p));
     }
     spot.style.opacity="0";shade.style.opacity="1";
     return;
   }
   root.classList.remove("sf-tour-center");
   root.classList.add("sf-tour-focused");
   shade.style.opacity="0";
   const rect=targetRect(element),vw=innerWidth,vh=innerHeight,pad=7,margin=12,gap=14;
   const spotlight={
     left:clamp(rect.left-pad,2,vw-2),
     top:clamp(rect.top-pad,2,vh-2),
     right:clamp(rect.right+pad,2,vw-2),
     bottom:clamp(rect.bottom+pad,2,vh-2)
   };
   spot.style.left=spotlight.left+"px";
   spot.style.top=spotlight.top+"px";
   spot.style.width=Math.max(5,spotlight.right-spotlight.left)+"px";
   spot.style.height=Math.max(5,spotlight.bottom-spotlight.top)+"px";
   spot.style.opacity="1";
   if(manualPosition){
     card.style.left=clamp(parseFloat(card.style.left)||margin,margin,Math.max(margin,vw-card.offsetWidth-margin))+"px";
     card.style.top=clamp(parseFloat(card.style.top)||margin,margin,Math.max(margin,vh-card.offsetHeight-margin))+"px";
     return;
   }
   const normalWidth=Math.min(392,vw-2*margin);
   const freeRight=vw-rect.right-gap-margin,freeLeft=rect.left-gap-margin;
   const variants=[];
   const add=(width,left,top,kind)=>{
     const w=clamp(width,Math.min(225,vw-2*margin),normalWidth);
     card.style.width=w+"px";
     const height=card.offsetHeight;
     const l=clamp(left,margin,Math.max(margin,vw-w-margin));
     const t=clamp(top,margin,Math.max(margin,vh-height-margin));
     const overlapW=Math.max(0,Math.min(l+w,spotlight.right)-Math.max(l,spotlight.left));
     const overlapH=Math.max(0,Math.min(t+height,spotlight.bottom)-Math.max(t,spotlight.top));
     const overlap=overlapW*overlapH;
     const gapX=Math.max(0,spotlight.left-(l+w),l-spotlight.right);
     const gapY=Math.max(0,spotlight.top-(t+height),t-spotlight.bottom);
     const distance=Math.hypot(gapX,gapY);
     const cost=overlap*70+distance*3+Math.max(0,normalWidth-w)*.9+(kind==="corner"?65:0);
     variants.push({cost,left:l,top:t,width:w});
   };
   const typicalHeight=Math.min(card.scrollHeight,innerHeight-2*margin,412);
   if(freeRight>=225){
     const width=Math.min(normalWidth,freeRight);
     add(width,rect.right+gap,rect.top,"right");
     add(width,rect.right+gap,rect.bottom-typicalHeight,"right");
   }
   if(freeLeft>=225){
     const width=Math.min(normalWidth,freeLeft);
     add(width,rect.left-gap-width,rect.top,"left");
     add(width,rect.left-gap-width,rect.bottom-typicalHeight,"left");
   }
   const centerX=rect.left+rect.width/2-normalWidth/2;
   add(normalWidth,centerX,rect.top-gap-typicalHeight,"above");
   add(normalWidth,centerX,rect.bottom+gap,"below");
   add(normalWidth,margin,margin,"corner");
   add(normalWidth,vw-normalWidth-margin,margin,"corner");
   add(normalWidth,margin,vh-typicalHeight-margin,"corner");
   add(normalWidth,vw-normalWidth-margin,vh-typicalHeight-margin,"corner");
   variants.sort((a,b)=>a.cost-b.cost);
   const best=variants[0];
   card.style.width=best.width+"px";
   card.style.left=Math.round(best.left)+"px";
   card.style.top=Math.round(clamp(best.top,margin,Math.max(margin,vh-card.offsetHeight-margin)))+"px";
 };
 const locate=()=>{
   const el=target(STEPS[current]);
   if(el?.isConnected){
     const r=targetRect(el),small=innerWidth<760;
     const desiredHeight=Math.min(card.offsetHeight||360,innerHeight-24)+20;
     const squeezed=small && r.height<innerHeight*.48 && r.top<desiredHeight && innerHeight-r.bottom<desiredHeight;
     if(squeezed){
       el.scrollIntoView({behavior:"smooth",block:"start",inline:"nearest"});
     }else if(r.top<95||r.bottom>innerHeight-88){
       el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"center",inline:"nearest"});
     }
   }
   requestAnimationFrame(move);setTimeout(move,160);setTimeout(move,450);
 };
 function show(i){
   if(i<0||i>=STEPS.length)return;
   active=true;current=i;manualPosition=false;root.hidden=false;$("#sf-tour-launcher").hidden=true;
   const s=STEPS[i];
   setup(s);
   $("#sf-tour-chapter").textContent=s.chapter;
   $("#sf-tour-counter").textContent=`${String(i+1).padStart(2,"0")} / ${String(STEPS.length).padStart(2,"0")}`;
   $("#sf-tour-title").textContent=s.title;
   $("#sf-tour-description").textContent=s.body;
   $("#sf-tour-insight").textContent=s.insight;
   $("#sf-tour-progress-fill").style.width=`${(i+1)*100/STEPS.length}%`;
   $("#sf-tour-back").disabled=i===0;
   $("#sf-tour-next").innerHTML=`${safe(s.setup==="keepPlan"&&plan()?"استعراض المسودة":s.next||(i===STEPS.length-1?"إنهاء الجولة":"التالي"))} <span aria-hidden="true">←</span>`;
   $("#sf-tour-hint").textContent=i===STEPS.length-1?"تقدر ترجع لأي مرحلة أو تكمل باستخدام النظام بحرية.":"الخطوة التالية بتنقلك مباشرة إلى الجزء المطلوب داخل النظام.";
   contents();locate();
 }
 const end=()=>{active=false;close();root.hidden=true;$("#sf-tour-launcher").hidden=false;$("#sf-tour-launcher").focus();};
 const next=()=>{
   if(moving)return;
   moving=true;
   try{
     if(current===STEPS.length-1){end();return;}
     if(STEPS[current].setup==="keepPlan"&&!createPlan()){
       $("#sf-tour-insight").textContent="تعذّر إنشاء مسودة MPS. راجع الطلب وتاريخ البداية، وحاول مرة ثانية.";
       move();return;
     }
     show(current+1);
   }finally{moving=false;}
 };
 const openDrawer=open=>{
   drawerOpen=open;drawer.hidden=!open;
   if(open){contents();$("#sf-tour-drawer-close").focus();}
   else{move();$("#sf-tour-overview").focus();}
 };
 function init(){

   const grip=$(".sf-tour-top");
   grip.addEventListener("pointerdown",event=>{
     if(event.button!==0||event.target.closest("button,a,input,select,textarea"))return;
     const rect=card.getBoundingClientRect();
     manualPosition=true;
     drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
     root.classList.remove("sf-tour-center");
     root.classList.add("sf-tour-focused","sf-tour-dragging");
     card.style.width=rect.width+"px";
     card.style.left=rect.left+"px";
     card.style.top=rect.top+"px";
     try{grip.setPointerCapture(event.pointerId);}catch{}
     event.preventDefault();
   });
   grip.addEventListener("pointermove",event=>{
     if(!drag||event.pointerId!==drag.id)return;
     card.style.left=clamp(drag.left+event.clientX-drag.x,10,Math.max(10,innerWidth-card.offsetWidth-10))+"px";
     card.style.top=clamp(drag.top+event.clientY-drag.y,10,Math.max(10,innerHeight-card.offsetHeight-10))+"px";
     event.preventDefault();
   });
   const releaseGrip=event=>{
     if(!drag||event.pointerId!==drag.id)return;
     drag=null;root.classList.remove("sf-tour-dragging");
     try{grip.releasePointerCapture(event.pointerId);}catch{}
     move();
   };
   grip.addEventListener("pointerup",releaseGrip);
   grip.addEventListener("pointercancel",releaseGrip);
   $("#sf-tour-next").addEventListener("click",next);
   $("#sf-tour-back").addEventListener("click",()=>show(current-1));
   $("#sf-tour-close").addEventListener("click",end);
   $("#sf-tour-launcher").addEventListener("click",()=>show(current));
   $("#sf-tour-overview").addEventListener("click",()=>openDrawer(true));
   $("#sf-tour-drawer-close").addEventListener("click",()=>openDrawer(false));
   $("#sf-tour-drawer-list").addEventListener("click",e=>{
     const b=e.target.closest("[data-go]");
     if(b){openDrawer(false);show(Number(b.dataset.go));}
   });
   document.addEventListener("keydown",e=>{
     if(!active||["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName)||e.ctrlKey||e.altKey||e.metaKey)return;
     if(e.key==="ArrowLeft"||e.key==="PageDown"){e.preventDefault();e.stopImmediatePropagation();next();}
     if(e.key==="ArrowRight"||e.key==="PageUp"){e.preventDefault();e.stopImmediatePropagation();show(current-1);}
     if(e.key==="Escape"&&drawerOpen){e.preventDefault();e.stopImmediatePropagation();openDrawer(false);}
   },true);
   window.addEventListener("resize",()=>requestAnimationFrame(move));
   document.addEventListener("scroll",move,true);
   const observer=new MutationObserver(()=>{if(active)requestAnimationFrame(move);});
   observer.observe($("#page"),{childList:true});
   observer.observe($("#modal"),{childList:true});
   show(0);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();