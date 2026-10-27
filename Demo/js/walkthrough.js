(function supplyHelp(){
"use strict";
if (typeof SF_HELP_CONTENT === "undefined") return;

const $=(selector,scope=document)=>scope.querySelector(selector);
const $$=(selector,scope=document)=>Array.from(scope.querySelectorAll(selector));
const ROOT=$("#page"),MODAL=$("#modal"),PANEL=$("#sf-help-popover"),TOGGLE=$("#sf-help-toggle");
if(!ROOT||!MODAL||!PANEL||!TOGGLE)return;
const DOCS=SF_HELP_CONTENT,STORAGE="supplyflow-help-visible-v1";
let visible=true,opened=null,anchor=null,scheduled=false,repositionScheduled=false;
const inserted=new WeakMap();
const pageRules=[];
const add=(page,selector,key,mode="inside",multiple=false)=>pageRules.push({page,selector,key,mode,multiple});
const group=(page,list)=>{for(const [selector,key,mode,multiple] of list)add(page,selector,key,mode,multiple)};
group("dashboard",[
[".page-intro h1","dashboard.overview"],
[".dashboard-hero .hero-text h2","dashboard.overview"],
[".metric-grid .metric-card:nth-child(1) .metric-top > span:first-child","dashboard.net"],
[".metric-grid .metric-card:nth-child(2) .metric-top > span:first-child","dashboard.batches"],
[".metric-grid .metric-card:nth-child(3) .metric-top > span:first-child","dashboard.shortages"],
[".metric-grid .metric-card:nth-child(4) .metric-top > span:first-child","dashboard.ready"],
[".attention-box strong","dashboard.attention"],
[".content-grid .panel:nth-child(1) .panel-head h3","dashboard.utilization"],
[".content-grid .panel:nth-child(2) .panel-head h3","dashboard.activity"],
["#page > .panel:last-child .panel-head h3","dashboard.queue"],
[".page-intro [data-action='export-mps']","common.csv","after"],
[".dashboard-hero [data-action='add-demand']","demand.new","after"]
]);
group("demands",[
[".page-intro h1","demand.overview"],
[".formula-strip [data-help-override], .formula-strip strong","demand.formula"],
[".panel .toolbar-title","demand.records"],
[".hint-card strong","demand.duplicate"],
[".page-intro [data-action='add-demand']","demand.new","after"],
[".page-intro [data-action='open-import']","demand.import","after"],
[".table-wrap thead th:nth-child(1)","demand.th.id"],
[".table-wrap thead th:nth-child(2)","demand.th.product"],
[".table-wrap thead th:nth-child(3)","demand.th.forecast"],
[".table-wrap thead th:nth-child(4)","demand.th.stock"],
[".table-wrap thead th:nth-child(5)","demand.th.net"],
[".table-wrap thead th:nth-child(6)","demand.th.due"]
]);
group("conversions",[
[".page-intro h1","conversion.overview"],
[".steps-ribbon .ribbon-active","conversion.pack"],
[".conversion-card .product-top h3","conversion.overview","inside",true],
[".conversion-card .conversion-flow > div:nth-child(1) small","conversion.pack","inside",true],
[".conversion-card .conversion-flow > div:nth-child(3) small","conversion.minors","inside",true],
[".conversion-card .conversion-specs > div:nth-child(1) span","conversion.yield","inside",true],
[".conversion-card .conversion-specs > div:nth-child(2) span","conversion.batch","inside",true],
[".conversion-card .conversion-specs > div:nth-child(3) span","conversion.input","inside",true],
[".conversion-card .conversion-specs > div:nth-child(4) span","conversion.output","inside",true],
[".conversion-card .conversion-specs > div:nth-child(5) span","conversion.surplus","inside",true],
[".conversion-card .conversion-bottom small","conversion.batches","inside",true],
[".page-intro [data-action='goto-master']","master.products","after"]
]);
group("constraints",[
[".page-intro h1","constraints.overview"],
[".constraint-kpis .metric-card:nth-child(1) .metric-top span:first-child","constraints.short"],
[".constraint-kpis .metric-card:nth-child(2) .metric-top span:first-child","constraints.late"],
[".constraint-kpis .metric-card:nth-child(3) .metric-top span:first-child","constraints.cleanHours"],
[".constraint-item:nth-child(1) h3","constraints.materials"],
[".constraint-item:nth-child(2) h3","constraints.routing"],
[".constraint-item:nth-child(3) h3","constraints.util"],
[".constraint-item:nth-child(4) h3","constraints.clean"],
[".constraint-item:nth-child(5) h3","constraints.qa"],
[".content-grid .panel:nth-child(1) .panel-head h3","constraints.lineLoads"],
[".content-grid .panel:nth-child(2) .panel-head h3","constraints.stages"],
["#page > .panel:last-child .panel-head h3","constraints.review"],
[".page-intro [data-action='goto-master']","master.capacity","after"]
]);
group("mps",[
[".page-intro h1","mps.overview"],
[".page-intro [data-action='add-plan']","mps.create","after"],
[".page-intro [data-action='export-mps']","action.export","after"],
[".inline-stats > div:nth-child(1) span","mps.plans"],
[".inline-stats > div:nth-child(2) span","mps.ready"],
[".inline-stats > div:nth-child(3) span","mps.inProd"],
[".inline-stats > div:nth-child(4) span","mps.qaReleased"],
[".toolbar .toolbar-title","mps.table"],
[".workflow-ribbon div:nth-of-type(1) strong","mps.flow"],
[".table-wrap thead th:nth-child(1)","mps.table"],
[".table-wrap thead th:nth-child(3)","conversion.batches"],
[".table-wrap thead th:nth-child(5)","constraints.qa"],
[".table-wrap thead th:nth-child(7)","mps.flow"]
]);
group("procurement",[
[".page-intro h1","mrp.overview"],
[".proc-highlight > small","mrp.shortage"],
[".proc-logic strong","mrp.logic"],
[".toolbar .toolbar-title","mrp.overview"],
[".table-wrap thead th:nth-child(2)","mrp.released"],
[".table-wrap thead th:nth-child(3)","mrp.reserved"],
[".table-wrap thead th:nth-child(4)","mrp.draft"],
[".table-wrap thead th:nth-child(5)","mrp.gap"],
[".table-wrap thead th:nth-child(6)","mrp.lead"],
[".page-intro [data-action='export-mrp']","action.export","after"],
[".page-intro [data-action='add-lot']","mrp.lot","after"]
]);
group("master",[
[".page-intro h1","master.overview"],
[".tab-bar","master.overview","badge"]
]);
group("audit",[
[".page-intro h1","audit.overview"],
[".audit-list .audit-event:first-child strong","audit.events"],
[".panel .audit-list","audit.events","badge"],
[".page-intro [data-action='export-audit']","action.export","after"]
]);
const masterProducts=[
[".panel-head h3","master.products"],
[".table-wrap thead th:nth-child(1)","master.sku"],
[".table-wrap thead th:nth-child(2)","master.packSize"],
[".table-wrap thead th:nth-child(3)","master.yield"],
[".table-wrap thead th:nth-child(4)","master.batchSize"],
[".table-wrap thead th:nth-child(5)","master.routing"],
[".table-wrap thead th:nth-child(6)","master.bom"],
[".panel-head [data-action='add-product']","master.products","after"]
];
const masterMaterials=[
[".panel-head h3","master.materials"],
[".material-card .material-top strong","master.materials","inside",true],
[".material-card .lot-row:first-child b","master.lots","inside",true],
[".panel-head [data-action='add-material']","master.materials","after"],
[".panel-head [data-action='add-lot']","mrp.lot","after"]
];
const masterLines=[
[".panel-head h3","master.lines"],
[".table-wrap thead th:nth-child(3)","master.capacity"],
[".table-wrap thead th:nth-child(4)","master.capacity"]
];
const masterSettings=[
[".settings-panel h3","master.settings"],
[".settings-list > div:nth-child(1) span","master.qcDays"],
[".settings-list > div:nth-child(2) span","master.qaDays"],
[".settings-list > div:nth-child(3) span","master.cleanTime"]
];

const modalRules=[
[".plan-details .detail-kpis > div:nth-child(1) small","conversion.batches"],
[".plan-details .detail-kpis > div:nth-child(2) small","dashboard.net"],
[".plan-details .detail-kpis > div:nth-child(3) small","form.plan.startDate"],
[".plan-details .detail-kpis > div:nth-child(4) small","constraints.qa"],
[".plan-details .detail-footnotes","mps.timings","badge"],
[".plan-details .modal-actions","mps.issue","badge"],
["[data-form='plan'] #plan-preview","mps.create","badge"],
[".import-panel p","demand.import","badge"],
[".import-panel .import-actions","import.template","badge"],
[".import-panel .upload-target","import.file","badge"],
["[data-form='bom'] .row-labels > span:nth-child(1)","form.bom.materialId"],
["[data-form='bom'] .row-labels > span:nth-child(2)","form.bom.qty"],
["[data-form='routing'] .row-labels > span:nth-child(1)","form.route.stage"],
["[data-form='routing'] .row-labels > span:nth-child(2)","form.route.lineId"],
["[data-form='routing'] .row-labels > span:nth-child(3)","form.route.hours"]
];
const formFields={
demand:{productId:"form.demand.productId",market:"form.demand.market",forecast:"form.demand.forecast",firmOrders:"form.demand.firmOrders",fgStock:"form.demand.fgStock",incoming:"form.demand.incoming",safety:"form.demand.safety",agentStock:"form.demand.agentStock",history:"form.demand.history",dueDate:"form.demand.dueDate",priority:"form.demand.priority",notes:"form.demand.notes"},
plan:{demandId:"form.plan.demandId",startDate:"form.plan.startDate",needBy:"form.plan.needBy"},
product:{sku:"form.product.sku",name:"form.product.name",drugForm:"form.product.drugForm",packSize:"form.product.packSize",minorUnit:"form.product.minorUnit",yieldPct:"form.product.yieldPct",batchSize:"form.product.batchSize"},
material:{code:"form.material.code",name:"form.material.name",unit:"form.material.unit",leadDays:"form.material.leadDays"},
lot:{materialId:"form.lot.materialId",lotNo:"form.lot.lotNo",qty:"form.lot.qty",expiry:"form.lot.expiry",status:"form.lot.status"},
line:{dailyHours:"form.line.dailyHours"},
settings:{qcLeadDays:"form.settings.qcLeadDays",qaLeadDays:"form.settings.qaLeadDays",defaultCleaningHours:"form.settings.defaultCleaningHours"},
"plan-date":{startDate:"form.planDate.startDate"}
};

function createIcon(key){
  const info=DOCS[key];
  if(!info)return null;
  const button=document.createElement("button");
  button.type="button";
  button.className="sf-help-icon";
  button.dataset.helpKey=key;
  button.title=`شرح: ${info.title}`;
  button.setAttribute("aria-label",`شرح ${info.title}`);
  button.setAttribute("aria-haspopup","dialog");
  button.setAttribute("aria-expanded","false");
  button.textContent="?";
  return button;
}
function mark(anchor,key,mode="inside"){
  if(!anchor||!DOCS[key])return;
  let ids=inserted.get(anchor);
  if(!ids){ids=new Set();inserted.set(anchor,ids);}
  if(ids.has(key))return;
  const icon=createIcon(key);
  if(!icon)return;
  ids.add(key);
  if(mode==="after")anchor.insertAdjacentElement("afterend",icon);
  else if(mode==="badge"){
    anchor.classList.add("sf-help-badge-anchor");
    anchor.append(icon);
  }else{
    anchor.append(icon);
  }
}
const mapList=(scope,items)=>{
  for(const [selector,key,mode,multiple] of items){
    const nodes=$$(selector,scope);
    for(const anchor of (multiple?nodes:nodes.slice(0,1)))mark(anchor,key,mode);
  }
};
function markForms(){
  for(const form of $$("[data-form]",MODAL)){
    const mapping=formFields[form.dataset.form];
    if(!mapping)continue;
    for(const [name,key] of Object.entries(mapping)){
      const input=$(`[name="${name}"]`,form);
      if(!input)continue;
      const field=input.closest("label.field");
      const span=field?.querySelector(":scope > span");
      if(span)mark(span,key);
    }
  }
}
function refresh(){
  scheduled=false;
  if(!visible)return;
  const page=$(".nav-link.active[data-page]")?.dataset.page||"dashboard";
  mapList(ROOT,pageRules.filter(r=>r.page===page).map(r=>[r.selector,r.key,r.mode,r.multiple]));
  if(page==="master"){
    const tab=$(".tab-bar .tab.active")?.dataset.master||"products";
    const tabs={products:masterProducts,materials:masterMaterials,lines:masterLines,settings:masterSettings};
    mapList(ROOT,tabs[tab]||[]);
  }
  mapList(MODAL,modalRules);
  markForms();
  const sections=$(".plan-details .modal-section",MODAL);
  if(sections[0])mark($("h3",sections[0]),"mps.materials");
  if(sections[1])mark($("h3",sections[1]),"mps.routing");
  const modalTitle=$(".modal-head h2",MODAL);
  if(modalTitle){
    const type=$("[data-form]",MODAL)?.dataset.form;
    const modalKeys={demand:"demand.new",plan:"mps.create",product:"master.products",routing:"master.routing",bom:"master.bom",material:"master.materials",lot:"mrp.lot",line:"master.capacity",settings:"master.settings","plan-date":"form.planDate.startDate"};
    const key=$(".plan-details",MODAL)?"mps.details":modalKeys[type];
    if(key)mark(modalTitle,key);
  }
  if(opened && (!anchor?.isConnected || !document.body.contains(anchor)))hide();
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(refresh);
}
function show(icon){
  if(!visible)return;
  const key=icon.dataset.helpKey,entry=DOCS[key];
  if(!entry)return;
  if(opened===key&&anchor===icon){hide();return;}
  if(anchor){anchor.setAttribute("aria-expanded","false");anchor.classList.remove("sf-help-selected");}
  opened=key;anchor=icon;
  icon.setAttribute("aria-expanded","true");
  $("#sf-help-title").textContent=entry.title;
  $("#sf-help-body").textContent=entry.body;
  $("#sf-help-detail").textContent=entry.how;
  const example=$("#sf-help-example");
  example.hidden=!entry.example;
  $("p",example).textContent=entry.example||"";
  const result=$("#sf-help-result");
  result.hidden=!entry.result;
  result.textContent=entry.result||"";
  const names={dashboard:"لوحة التحكم",demands:"الطلب وصافي الاحتياج",conversions:"التحويل والتشغيلات",constraints:"محددات التخطيط",mps:"خطة الإنتاج MPS",procurement:"إشارات المشتريات MRP",master:"البيانات الرئيسية",audit:"سجل النشاط"};
  const page=$(".nav-link.active[data-page]")?.dataset.page;
  $("#sf-help-context").textContent=$("#modal.open .modal-head")?"تفاصيل الشاشة":names[page]||"شرح العنصر";
  PANEL.hidden=false;
  $(".sf-help-scroll",PANEL).scrollTop=0;
  icon.classList.add("sf-help-selected");
  position();
}
function hide(){
  PANEL.hidden=true;
  if(anchor){anchor.setAttribute("aria-expanded","false");anchor.classList.remove("sf-help-selected");}
  opened=null;anchor=null;
}
function position(){
  repositionScheduled=false;
  if(PANEL.hidden||!anchor?.isConnected)return;
  const a=anchor.getBoundingClientRect();
  if(a.width===0||a.height===0){hide();return;}
  const vw=window.innerWidth,vh=window.innerHeight,pad=10,gap=11;
  PANEL.style.maxWidth=`${Math.max(230,vw-2*pad)}px`;
  PANEL.style.left=`${pad}px`;
  PANEL.style.top=`${pad}px`;
  const pw=PANEL.offsetWidth,ph=PANEL.offsetHeight;
  const clamp=(v,min,max)=>Math.max(min,Math.min(v,max));
  const placements=[
    {side:"left",left:a.left-pw-gap,top:a.top-22},
    {side:"right",left:a.right+gap,top:a.top-22},
    {side:"bottom",left:a.left-pw/2+a.width/2,top:a.bottom+gap},
    {side:"top",left:a.left-pw/2+a.width/2,top:a.top-ph-gap}
  ];
  const targetMidY=(a.top+a.bottom)/2;
  let best=null;
  for(const p of placements){
    const x=clamp(p.left,pad,Math.max(pad,vw-pw-pad));
    const y=clamp(p.top,pad,Math.max(pad,vh-ph-pad));
    const intersectsX=Math.max(0,Math.min(x+pw,a.right)-Math.max(x,a.left));
    const intersectsY=Math.max(0,Math.min(y+ph,a.bottom)-Math.max(y,a.top));
    const overlap=intersectsX*intersectsY;
    const overflowX=Math.abs(p.left-x),overflowY=Math.abs(p.top-y);
    const away=Math.abs((y+ph/2)-targetMidY);
    const score=overlap*50+overflowX*1.7+overflowY*1.7+away*.05;
    if(!best||score<best.score)best={x,y,score,side:p.side};
  }
  if(!best)return;
  PANEL.style.left=`${Math.round(best.x)}px`;
  PANEL.style.top=`${Math.round(best.y)}px`;
  PANEL.dataset.side=best.side;
}
function queuePosition(){
  if(repositionScheduled)return;
  repositionScheduled=true;
  requestAnimationFrame(position);
}
function setVisible(on){
  visible=Boolean(on);
  document.body.classList.toggle("sf-help-hidden",!visible);
  TOGGLE.setAttribute("aria-pressed",String(visible));
  $("#sf-help-toggle-label").textContent=visible?"شرح العناصر":"إظهار الشرح";
  if(!visible)hide();
  else schedule();
  try{localStorage.setItem(STORAGE,visible?"on":"off");}catch{}
}
function init(){
  try{visible=localStorage.getItem(STORAGE)!=="off";}catch{}
  document.body.classList.toggle("sf-help-hidden",!visible);
  TOGGLE.setAttribute("aria-pressed",String(visible));
  $("#sf-help-toggle-label").textContent=visible?"شرح العناصر":"إظهار الشرح";
  TOGGLE.addEventListener("click",()=>setVisible(!visible));
  $("#sf-help-close").addEventListener("click",hide);
  $("#sf-help-done").addEventListener("click",hide);
  document.addEventListener("click",event=>{
    const icon=event.target.closest(".sf-help-icon");
    if(!icon)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    show(icon);
  },true);
  document.addEventListener("pointerdown",event=>{
    if(PANEL.hidden)return;
    if(!event.target.closest("#sf-help-popover,.sf-help-icon"))hide();
  },true);
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!PANEL.hidden){event.stopImmediatePropagation();hide();}
  },true);
  document.addEventListener("scroll",queuePosition,true);
  window.addEventListener("resize",queuePosition);
  const observer=new MutationObserver(schedule);
  observer.observe(ROOT,{childList:true,subtree:true});
  observer.observe(MODAL,{childList:true,subtree:true});
  schedule();
  window.SupplyFlowHelp={openByKey(key){
    const el=$(`.sf-help-icon[data-help-key="${key}"]`);
    if(el)show(el);
    return Boolean(el);
  },close:hide,showMarkers:()=>setVisible(true),hideMarkers:()=>setVisible(false),get count(){return Object.keys(DOCS).length}};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();