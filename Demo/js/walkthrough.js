(function walkthrough(){
 "use strict";
 if(typeof SF_GUIDE_STEPS==="undefined" || !window.SP?.store)return;
 const STEPS=SF_GUIDE_STEPS,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const state=()=>SP.store.get(),plan=()=>state().plans.find(x=>x.demandId==="DEM-1001"&&x.status!=="CANCELLED");
 const root=$("#sf-tour"),card=$("#sf-tour-card"),spot=$("#sf-tour-spotlight"),shade=$("#sf-tour-shade"),drawer=$("#sf-tour-drawer");
 let current=0,active=true,drawerOpen=false,moving=false,focus=null;
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
 const move=()=>{
   if(!active||drawerOpen)return;
   const el=target(STEPS[current]);focus=el;
   if(!el||!el.isConnected){
     root.classList.add("sf-tour-center");root.classList.remove("sf-tour-focused");
     spot.style.opacity="0";shade.style.opacity="1";
     ["top","left","right","bottom","width"].forEach(x=>card.style.removeProperty(x));
     return;
   }
   root.classList.remove("sf-tour-center");root.classList.add("sf-tour-focused");shade.style.opacity="0";
   const rect=el.getBoundingClientRect(),vw=innerWidth,vh=innerHeight;
   const margin=14,pad=7,gap=17,w=Math.min(425,vw-28);
   const x=Math.max(4,rect.left-pad),y=Math.max(4,rect.top-pad);
   spot.style.left=`${x}px`;spot.style.top=`${y}px`;
   spot.style.width=`${Math.max(18,Math.min(vw-x-4,rect.width+pad*2))}px`;
   spot.style.height=`${Math.max(18,Math.min(vh-y-4,rect.height+pad*2))}px`;spot.style.opacity="1";
   card.style.width=`${w}px`;
   const h=card.offsetHeight;
   let left,top;
   if(rect.left>w+gap+margin){left=rect.left-w-gap;top=rect.top+Math.min(20,(rect.height-h)/2);}
   else if(vw-rect.right>w+gap+margin){left=rect.right+gap;top=rect.top+Math.min(20,(rect.height-h)/2);}
   else if(vh-rect.bottom>=h+gap+margin){left=rect.left+rect.width/2-w/2;top=rect.bottom+gap;}
   else if(rect.top>=h+gap+margin){left=rect.left+rect.width/2-w/2;top=rect.top-h-gap;}
   else{left=vw-w-margin;top=vh-h-margin;}
   card.style.left=`${Math.max(margin,Math.min(vw-w-margin,left))}px`;
   card.style.top=`${Math.max(margin,Math.min(vh-h-margin,top))}px`;
 };
 const locate=()=>{
   const el=target(STEPS[current]);
   if(el?.isConnected){
     const r=el.getBoundingClientRect();
     if(r.top<95||r.bottom>innerHeight-88){
       el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"center",inline:"nearest"});
     }
   }
   requestAnimationFrame(move);setTimeout(move,160);setTimeout(move,450);
 };
 function show(i){
   if(i<0||i>=STEPS.length)return;
   active=true;current=i;root.hidden=false;$("#sf-tour-launcher").hidden=true;
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
   if(!$(".sf-tour-more")){
     const d=document.createElement("details");d.className="sf-tour-more";
     d.innerHTML="<summary>نص المقدم · شرح أوسع</summary><p id='sf-tour-narration'></p>";
     $("#sf-tour-insight").insertAdjacentElement("afterend",d);
   }
   $(".sf-tour-more").open=false;$("#sf-tour-narration").textContent=s.note||s.body;
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