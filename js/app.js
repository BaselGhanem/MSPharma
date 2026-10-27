(function () {
  const SP = window.SP, E = SP.engine, Store = SP.store;
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const h = (value) => String(value ?? ``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`);
  const n = (value,digits=0) => Number(value || 0).toLocaleString(`en-US`,{minimumFractionDigits:digits,maximumFractionDigits:digits});
  const dateLabel = (value) => {if(!value) return `—`; const d=new Date(`${value.slice(0,10)}T12:00:00`); return Number.isNaN(d.getTime()) ? h(value) : new Intl.DateTimeFormat(`en-GB`,{day:`2-digit`,month:`short`,year:`numeric`}).format(d);};
  const statusName = {DRAFT:`مسودة`,READY:`جاهز للإصدار`,BLOCKED:`موقوف`,RELEASED:`MPS صادر`,IN_PRODUCTION:`قيد الإنتاج`,QUARANTINE:`حجر / فحص QC`,QC_PASSED:`بانتظار إفراج QA`,QA_RELEASED:`QA Released`,CANCELLED:`ملغي`};
  const statusTone = {DRAFT:`muted`,READY:`success`,BLOCKED:`danger`,RELEASED:`info`,IN_PRODUCTION:`warning`,QUARANTINE:`warning`,QC_PASSED:`info`,QA_RELEASED:`success`,CANCELLED:`muted`};
  const S = () => Store.get();
  const product = (id) => E.byId(S().products,id);
  const demand = (id) => E.byId(S().demands,id);
  const line = (id) => E.byId(S().lines,id);
  const option = (value,label,selected) => `<option value="${h(value)}" ${value===selected?`selected`:``}>${h(label)}</option>`;
  const pill = (text,tone=`muted`) => `<span class="pill ${tone}">${h(text)}</span>`;
  const empty = (title,text,action=``) => `<div class="empty-state"><div class="empty-icon">◇</div><h3>${h(title)}</h3><p>${h(text)}</p>${action}</div>`;
  const shell = (kicker,title,desc,actions=``) => `<section class="page-intro"><div><div class="kicker">${kicker}</div><h1>${title}</h1><p>${desc}</p></div>${actions?`<div class="page-actions">${actions}</div>`:``}</section>`;
  const btn = (label,action,variant=`primary`,extra=``) => `<button class="btn ${variant}" data-action="${action}" ${extra}>${label}</button>`;
  const table = (headers,rows) => `<div class="table-wrap"><table><thead><tr>${headers.map((th)=>`<th>${th}</th>`).join(``)}</tr></thead><tbody>${rows.join(``)}</tbody></table></div>`;
  const card = (body,cls=``) => `<div class="panel ${cls}">${body}</div>`;
  const sectionHeading = (title,description=``) => `<div class="section-heading"><h2>${title}</h2>${description?`<p>${description}</p>`:``}</div>`;
  const field = (label,name,type=`text`,value=``,extra=``) => `<label class="field"><span>${label}</span><input type="${type}" name="${name}" value="${h(value)}" ${extra}></label>`;
  const selection = (label,name,items,selected=``,extra=``) => `<label class="field"><span>${label}</span><select name="${name}" ${extra}>${items.map((it)=>option(it.value,it.label,selected)).join(``)}</select></label>`;
  const progress = (pct) => `<div class="progress"><span style="width:${Math.min(100,Math.max(0,pct))}%"></span></div>`;
  const productOptions = (selected) => S().products.map((p)=>({value:p.id,label:`${p.sku} — ${p.name}`}));
  const demoNotice = `<div class="demo-note"><span class="demo-icon">i</span><span><strong>Demo mode</strong> — جميع البيانات والأرقام تجريبية؛ ${Store.repository.persistent?`الحفظ محلي في هذا المتصفح`:`الحفظ مؤقت لهذه الجلسة لأن التخزين المحلي غير متاح`}، ولا يوجد اتصال فعلي بـ Firebase أو اعتماد GMP</span></div>`;
  let ui = {page:`dashboard`,query:``,masterTab:`products`,constraintsTab:`overview`};
  const computedStatus = (p,check) => p.status === `DRAFT` ? (check.ready?`READY`:`BLOCKED`) : p.status;
  const audits = (limit=5) => S().audit.slice(0,limit);
  const timelineAll = () => E.scheduleAll(S());
  const allChecks = () => {const sc=timelineAll();return S().plans.map((p)=>({plan:p,...E.constraints(S(),p,sc)}));};
  const allDemandRows = () => S().demands.map((d) => ({d,p:product(d.productId),calc:E.calculation(d,product(d.productId))}));
  const formatUnits = (minorUnit) => minorUnit===`ml` ? `ml` : h(minorUnit);
  const filterRows = (rows,getSearch) => rows.filter((r)=>getSearch(r).toLowerCase().includes(ui.query.toLowerCase()));
  const recent = () => audits().map((a)=>`<div class="activity-row"><div class="activity-dot"></div><div class="activity-body"><strong>${h(a.action)}</strong><small>${h(a.subject)} · ${new Date(a.at).toLocaleString(`en-GB`,{day:`2-digit`,month:`short`,hour:`2-digit`,minute:`2-digit`})}</small></div></div>`).join(``);

  function renderDashboard() {
    const list=allDemandRows(), checks=allChecks(), stock=E.materialOverview(S());
    const packs=list.reduce((s,r)=>s+(r.calc?.netPacks || 0),0);
    const batches=list.reduce((s,r)=>s+(r.calc?.batches || 0),0);
    const shortages=stock.filter((m)=>m.short>0).length;
    const ready=checks.filter((c)=>c.ready && c.plan.status===`DRAFT`).length;
    const needsPlan=list.filter((r)=>!S().plans.some((p)=>p.demandId===r.d.id)).length;
    const hero=`<div class="dashboard-hero"><div class="hero-text"><span class="hero-eyebrow"><span class="hero-ping"></span>SUPPLY INTELLIGENCE CENTER</span><h2>من التوقعات إلى خطة إنتاج<br><em>قابلة للتنفيذ</em></h2><p>تابع صافي الطلب، تحويل الوحدات، المواد، الطاقة الاستيعابية، وجدول إطلاق التشغيلات في مكان واحد</p><div class="hero-buttons">${btn(`+ طلب جديد`,`add-demand`,`white`)}${btn(`عرض خطة MPS ←`,`goto-mps`,`ghost-light`)}</div></div><div class="hero-graphic"><div class="graphic-label">PLANNING FLOW</div><div class="graphic-steps"><div class="graphic-step"><span>01</span><strong>DEMAND</strong><small>Net Requirements</small></div><div class="graphic-join"></div><div class="graphic-step active"><span>02</span><strong>CONVERT</strong><small>Yield & Batches</small></div><div class="graphic-join"></div><div class="graphic-step"><span>03</span><strong>EXECUTE</strong><small>Master Schedule</small></div></div><div class="graphic-metric"><span>ONE CONNECTED WORKFLOW</span><b>01 → 05</b></div></div></div>`;
    const metrics=`<div class="metric-grid">
      ${metric(`صافي الطلب`,n(packs),`Packs after stock & supply`,`◫`,`teal`)}
      ${metric(`التشغيلات المطلوبة`,n(batches),`Validated Batch Size`,`▧`,`blue`)}
      ${metric(`تنبيهات نواقص المواد`,n(shortages),`Materials with shortages`,`◬`,shortages?`red`:`teal`)}
      ${metric(`خطط جاهزة للإصدار`,n(ready),`From ${S().plans.length} created plans`,`◈`,`amber`)}
    </div>`;
    const s=timelineAll(), today=SP.todayISO();
    const dates=Array.from({length:7},(_,i)=>E.isoAdd(today,i));
    const maxPct=100;
    const bars=dates.map((date)=>{
      const consumed=S().lines.reduce((sum,l)=>sum+(s.booked[`${l.id}|${date}`] || 0),0);
      const total=S().lines.reduce((sum,l)=>sum+E.num(l.dailyHours),0);
      const pct=total?Math.round(consumed/total*100):0;
      return `<div class="bar-column"><span class="bar-value">${pct}%</span><div class="bar-track"><div class="bar-fill" style="height:${Math.max(pct?4:0,Math.min(maxPct,pct))}%"></div></div><small>${dateLabel(date).split(` `).slice(0,2).join(` `)}</small></div>`;
    }).join(``);
    const warning=needsPlan?`<div class="attention-box"><div class="attention-symbol">!</div><div><strong>${n(needsPlan)} طلبات بدون خطة إنتاج</strong><p>أنشئ خطط MPS لهذه الطلبات لمراجعة المواد والجدولة</p></div><button class="text-link" data-action="goto-demands">استعراض الطلبات ←</button></div>`:`<div class="attention-box good"><div class="attention-symbol">✓</div><div><strong>كل طلباتك لها خطة مبدئية</strong><p>استكمل فحص القيود وإصدار الخطط المطلوبة</p></div></div>`;
    const queues=filterRows(list,(r)=>`${r.d.id} ${r.p?.sku} ${r.d.market}`).slice(0,5).map((r)=>`<tr><td><span class="primary-cell">${h(r.p?.sku || `—`)}</span><small>${h(r.d.market)}</small></td><td>${h(r.d.id)}</td><td class="num">${n(r.calc.netPacks)}</td><td class="num">${n(r.calc.batches)}</td><td>${dateLabel(r.d.dueDate)}</td><td>${S().plans.some((p)=>p.demandId===r.d.id)?pill(`Plan created`,`info`):pill(`Awaiting plan`,`warning`)}</td></tr>`);
    return `${shell(`OVERVIEW / ${dateLabel(today).toUpperCase()}`,`لوحة التحكم`,`مؤشرات التخطيط الرئيسية ومسار العمل بالكامل`,btn(`تصدير تقرير CSV`,`export-mps`,`outline`))}${demoNotice}${hero}${metrics}${warning}<div class="content-grid"><div class="panel"><div class="panel-head"><div><h3>تحميل الخطوط خلال 7 أيام</h3><p>Utilization · تقدير مبني على الخطط الحالية</p></div>${pill(`7 days`,`muted`)}</div><div class="chart-bars">${bars}</div><div class="chart-key"><span class="key-mark"></span>حصة ساعات التشغيل المحجوزة من إجمالي ساعات الخطوط</div></div><div class="panel"><div class="panel-head"><div><h3>آخر النشاطات</h3><p>Audit trail · Local actions</p></div><button data-page="audit" class="subtle-link">عرض الكل ←</button></div><div class="activity-list">${recent()}</div></div></div><div class="panel"><div class="panel-head"><div><h3>قائمة الطلبات</h3><p>صافي الكميات وجاهزية التخطيط</p></div><button data-page="demands" class="subtle-link">جميع الطلبات ←</button></div>${queues.length?table([`المستحضر / السوق`,`رقم الطلب`,`Net Packs`,`Batches`,`تاريخ الحاجة`,`الحالة`],queues):empty(`لا توجد طلبات`,`ابدأ بإضافة الطلب الأول`)}</div>`;
  }
  function metric(label,value,sub,glyph,variant) {return `<div class="metric-card metric-${variant}"><div class="metric-top"><span>${label}</span><span class="metric-icon">${glyph}</span></div><strong>${value}</strong><small>${sub}</small></div>`;}
  function searchInput(ph=`بحث...`) {return `<label class="search-field"><span>⌕</span><input id="search-input" autocomplete="off" placeholder="${h(ph)}" value="${h(ui.query)}"></label>`;}
  function renderDemands() {
    const rows=filterRows(allDemandRows(),(r)=>`${r.d.id} ${r.d.market} ${r.d.priority} ${r.p?.sku} ${r.p?.name}`);
    return `${shell(`DEMAND / 01`,`الطلب وصافي الاحتياج`,`تعريف الاحتياج بالعبوات ومقارنته بالمخزون والطلب المؤكد`,`${btn(`استيراد CSV`,`open-import`,`outline`)}${btn(`+ طلب جديد`,`add-demand`)}`)}${demoNotice}<div class="formula-strip"><div><span>NET REQUIREMENTS</span><strong>Max(Forecast, Firm Orders) + Safety Stock − FG Stock − Incoming</strong></div><p>رصيد الوكلاء وبيانات السحب التاريخي للمرجعية التحليلية فقط ولا يتم خصمهما مرة ثانية تلقائيا</p></div><div class="panel"><div class="toolbar"><div class="toolbar-title">سجل الطلبات <span class="count">${rows.length}</span></div>${searchInput(`ابحث بالمنتج أو السوق أو رقم الطلب`)}</div>${rows.length ? table([`رقم الطلب / السوق`,`المنتج`,`Forecast / Orders`,`FG + Incoming`,`Net Packs`,`موعد الحاجة`,`الإجراء`],rows.map(({d,p,calc})=>`<tr><td><span class="primary-cell">${h(d.id)}</span><small>${h(d.market)} · ${h(d.priority)}</small></td><td><strong>${h(p?.sku || `—`)}</strong><small>${h(p?.name || `—`)}</small></td><td class="num">${n(d.forecast)} / ${n(d.firmOrders)}</td><td class="num">${n(d.fgStock)} + ${n(d.incoming)}</td><td><span class="accent-value">${n(calc.netPacks)}</span></td><td>${dateLabel(d.dueDate)}</td><td class="actions-cell"><button class="small-action" data-action="edit-demand" data-id="${h(d.id)}">تعديل</button><button class="small-action accent" data-action="plan-demand" data-id="${h(d.id)}">إنشاء MPS</button></td></tr>`)):empty(`لا توجد نتائج`,`جرّب البحث بكلمة أخرى`)}</div><div class="hint-card"><strong>منع العد المزدوج</strong><p>تم اعتماد أعلى قيمة بين التوقع والطلبات المؤكدة كمثال حسابي. إذا كانت سياسة الشركة تعتبر الطلبات المؤكدة إضافية للتوقع، يجب تغيير قاعدة Gross Demand بعد اعتمادها رسميا</p></div>`;
  }
  function renderConversions() {
    const rows=filterRows(allDemandRows(),(r)=>`${r.d.id} ${r.p?.sku} ${r.p?.name} ${r.d.market}`);
    return `${shell(`CONVERSION / 02`,`التحويل وحجم التشغيلات`,`تحويل Packs إلى Minors ثم تطبيق Yield وValidated Batch Size`,btn(`إعدادات المنتجات`,`goto-master`,`outline`))}<div class="steps-ribbon"><span class="ribbon-active">Packs</span><i>→</i><span>Net Minors</span><i>→</i><span>Yield-adjusted Input</span><i>→</i><span>Batches</span></div><div class="conversion-grid">${rows.map(({d,p,calc})=>`<article class="panel conversion-card"><div class="product-top"><div class="product-glyph">${p?.form===`LIQUID`?`◌`:p?.form===`CAPSULE`?`◧`:`▤`}</div><div><h3>${h(p?.name)}</h3><small>${h(p?.sku)} · ${h(d.market)} · ${h(d.id)}</small></div></div><div class="conversion-flow"><div><small>NET PACKS</small><strong>${n(calc.netPacks)}</strong></div><span>× ${n(p.packSize)}</span><div><small>NET MINORS</small><strong>${n(calc.netMinors)}</strong></div></div><div class="conversion-specs"><div><span>Yield</span><b>${n(p.yieldPct,1)}%</b></div><div><span>Validated Batch</span><b>${n(p.batchSize)} ${formatUnits(p.minorUnit)}</b></div><div><span>Input incl. yield</span><b>${n(calc.yieldAdjustedInput)}</b></div><div><span>Estimated good output</span><b>${n(calc.outputMinors)}</b></div><div><span>Surplus packed units*</span><b>${n(calc.surplusPacks)}</b></div></div><div class="conversion-bottom"><div><small>PLANNED BATCHES</small><b>${n(calc.batches)}</b></div><button class="small-action accent" data-action="plan-demand" data-id="${h(d.id)}">إنشاء خطة ←</button></div></article>`).join(``)}</div><div class="hint-card"><strong>ملاحظة الحسابات</strong><p>تم تعريف حجم الباتش هنا ككمية إدخال معتمدة بوحدة Minor. عدد التشغيلات = Ceil[Net Minors ÷ (Batch Size × Yield)]. القيم الناتجة تقديرية، ولا تعني السماح بتغيير حجم الباتش المعتمد أو تجاوز فحوصات الصلاحية والجودة. *الفائض النظري قبل أي حدود تعبئة خاصة بالسوق</p></div>`;
  }
  function renderConstraints() {
    const checks=allChecks(), summary=checks.reduce((r,c)=>{r.short+=c.shortages.length;r.late+=c.timeline?.late?1:0;r.clean+=c.timeline?.cleaningTotal || 0;return r;},{short:0,late:0,clean:0});
    const sc=timelineAll(); const today=SP.todayISO();
    const data=S().lines.map((l)=>{const used=Array.from({length:7},(_,i)=>sc.booked[`${l.id}|${E.isoAdd(today,i)}`] || 0).reduce((a,b)=>a+b,0);const available=E.num(l.dailyHours)*7;return {...l,used,pct:available?Math.round(used/available*100):0};});
    const stages=checks.flatMap((c)=>c.timeline?.steps || []);
    const lastChecks=checks.map((c)=>`<tr><td><strong>${h(product(c.plan.productId)?.sku || `—`)}</strong><small>${h(c.plan.id)}</small></td><td>${c.shortages.length?pill(`${c.shortages.length} shortage`,`danger`):pill(`Available`,`success`)}</td><td>${h(c.timeline?.bottleneck?.line || `—`)}</td><td>${n(c.timeline?.cleaningTotal || 0,1)} h</td><td>${dateLabel(c.timeline?.releaseDate)}</td><td>${c.timeline?.late?pill(`Late risk`,`warning`):pill(`On target`,`success`)}</td><td><button class="small-action" data-action="view-plan" data-id="${h(c.plan.id)}">تفاصيل</button></td></tr>`);
    return `${shell(`CONSTRAINTS / 03`,`محددات التخطيط الخمسة`,`قراءة موحدة لمواد التشغيل، المسارات، الطاقة، التنظيف، وفترات QC / QA`,btn(`تكوين الطاقة`,`goto-master`,`outline`))}<div class="constraint-kpis">${metric(`قيود المواد`,n(summary.short),`BOM shortage entries`,`01`,`red`)}${metric(`خطط معرضة للتأخير`,n(summary.late),`Estimated QA date > need by`,`02`,`amber`)}${metric(`ساعات التنظيف المقدرة`,n(summary.clean,1),`Campaign transitions`,`03`,`blue`)}</div><div class="five-constraints">
      ${constraintItem(`01`,`Material Availability / FEFO`,`المواد الخام والتغليف`,`فحص BOM وتخصيص الكميات المتاحة من اللوتات Released حسب أول انتهاء صلاحية`,summary.short?`هناك نواقص تتطلب مراجعة`:`لم تظهر نواقص في الخطط`,`mat`)}
      ${constraintItem(`02`,`Routing / Bottleneck`,`مسارات التصنيع وعنق الزجاجة`,`احتساب ساعات كل مرحلة مقابل الساعات اليومية المعتمدة للخط`,`${S().lines.length} خطوط معرفة`,`cap`)}
      ${constraintItem(`03`,`Utilization / Campaign`,`الاستغلال وتجميع الحملات`,`تجميع مراحل المنتج على الخطوط وتقدير إشغال الأيام السبعة المقبلة`,`7-day load simulation`,`util`)}
      ${constraintItem(`04`,`Cleaning & Line Clearance`,`التغيير والتنظيف`,`إضافة وقت التنظيف عند انتقال الخط بين مستحضرين مختلفين`,`${n(summary.clean,1)}h تقديرية`,`clean`)}
      ${constraintItem(`05`,`QC / QA Lead Time`,`زمن الفحص والإفراج`,`تضاف فترتا QC وQA إلى نهاية مسار التصنيع قبل موعد التوافر المتوقع`,`${n(S().settings.qcLeadDays+S().settings.qaLeadDays)} days total`,`qa`)}
    </div><div class="content-grid"><div class="panel"><div class="panel-head"><div><h3>Utilization by line</h3><p>الحمل المحجوز خلال 7 أيام / السعة المتاحة</p></div></div><div class="line-loads">${data.map((l)=>`<div class="line-load"><div class="line-load-head"><strong>${h(l.name)}</strong><span>${n(l.used,1)} / ${n(l.dailyHours*7)} h · ${l.pct}%</span></div>${progress(l.pct)}</div>`).join(``)}</div></div><div class="panel"><div class="panel-head"><div><h3>خطوات التشغيل المحجوزة</h3><p>تمثيل أولي للعمليات في الجدولة</p></div>${pill(`${stages.length} steps`,`info`)}</div><div class="stage-feed">${stages.length?stages.slice(0,10).map((st)=>`<div class="stage-row"><div class="stage-symbol">▹</div><div><strong>${h(st.stage)} · Batch ${n(st.batch)}</strong><small>${h(st.lineName)}</small></div><span>${dateLabel(st.start)}</span></div>`).join(``):empty(`لا توجد مراحل مجدولة`,`أنشئ خطة MPS لاستعراض توزيع ساعات العمليات`)}</div></div></div><div class="panel"><div class="panel-head"><div><h3>فحص الخطط مقابل القيود</h3><p>توقيت الإفراج المتوقع تقريبي حتى إجراء اعتماد QC وQA فعليا</p></div></div>${lastChecks.length?table([`الخطة`,`المواد`,`عنق الزجاجة`,`تنظيف`,`Estimated QA`,`الالتزام`,`عرض`],lastChecks):empty(`لم تنشأ خطط بعد`,`ابدأ بإنشاء خطة من شاشة الطلبات`)}</div>`;
  }
  function constraintItem(number,en,ar,desc,result,style) {return `<article class="constraint-item"><div class="constraint-count ${style}">${number}</div><div><small>${en}</small><h3>${ar}</h3><p>${desc}</p><span class="constraint-detail">${h(result)}</span></div></article>`;}
  function renderMPS() {
    const plans=filterRows(allChecks(),(c)=>`${c.plan.id} ${product(c.plan.productId)?.sku} ${demand(c.plan.demandId)?.market} ${c.plan.status}`);
    const columns=plans.map((c)=>{const p=c.plan,status=computedStatus(p,c);return `<tr><td><span class="primary-cell">${h(p.id)}</span><small>${h(demand(p.demandId)?.market || `—`)}</small></td><td><strong>${h(product(p.productId)?.sku || `—`)}</strong><small>${h(product(p.productId)?.name || `—`)}</small></td><td class="num">${n(p.batches)}</td><td>${dateLabel(p.startDate)}</td><td>${dateLabel(c.timeline?.releaseDate)}</td><td>${dateLabel(p.dueDate)}</td><td>${pill(statusName[status] || status,statusTone[status])}</td><td><button class="small-action accent" data-action="view-plan" data-id="${h(p.id)}">فتح الخطة ←</button></td></tr>`;});
    const ready=plans.filter((c)=>c.ready&&c.plan.status===`DRAFT`).length;
    return `${shell(`EXECUTION / 04`,`خطة الإنتاج الرئيسية MPS`,`إصدار وتتبّع التشغيلات ومسار الإفراج من الإنتاج إلى QC ثم QA`,`${btn(`تصدير CSV`,`export-mps`,`outline`)}${btn(`+ إنشاء خطة`,`add-plan`)}`)}<div class="inline-stats"><div><span>PLANS</span><strong>${n(plans.length)}</strong></div><div><span>READY TO RELEASE</span><strong>${n(ready)}</strong></div><div><span>IN PRODUCTION</span><strong>${n(plans.filter((c)=>c.plan.status===`IN_PRODUCTION`).length)}</strong></div><div><span>QA RELEASED</span><strong>${n(plans.filter((c)=>c.plan.status===`QA_RELEASED`).length)}</strong></div></div><div class="panel"><div class="toolbar"><div class="toolbar-title">أوامر وخطط التشغيل <span class="count">${plans.length}</span></div>${searchInput(`رقم الخطة، المنتج، السوق`)}</div>${plans.length?table([`MPS Reference`,`المنتج`,`Batches`,`بداية الإنتاج`,`QA المتوقع`,`تاريخ الحاجة`,`الحالة`,`التفاصيل`],columns):empty(`لا توجد خطط MPS`,`أنشئ أول خطة لاحتساب قيودها وجدولها`,btn(`+ إنشاء خطة`,`add-plan`))}</div><div class="workflow-ribbon"><div><span>01</span><strong>Plan Draft</strong></div><i>→</i><div><span>02</span><strong>MPS Released</strong></div><i>→</i><div><span>03</span><strong>Production Complete</strong></div><i>→</i><div><span>04</span><strong>QC Passed</strong></div><i>→</i><div><span>05</span><strong>QA Released</strong></div></div>`;
  }
  function renderProcurement() {
    const ov=filterRows(E.materialOverview(S()),(m)=>`${m.id} ${m.name}`);
    const risk=ov.filter((m)=>m.short>0);
    return `${shell(`MATERIALS / 05`,`نواقص المواد وإشارات MRP`,`احتياج BOM للتشغيلات مقابل اللوتات الصالحة والمفرج عنها`,`${btn(`تصدير النواقص`,`export-mrp`,`outline`)}${btn(`+ إضافة Lot`,`add-lot`)}`)}<div class="procurement-summary"><div class="proc-highlight"><small>MATERIAL SHORTAGES</small><strong>${n(risk.length)}</strong><span>مواد بحاجة لمتابعة المشتريات</span></div><div class="proc-logic"><strong>قواعد توفر المواد</strong><p>يتاح للاستخدام فقط الـ Lot بحالة Released وصلاحيته لم تنته عند موعد الاستخدام. يحسب الالتزام الفعلي للخطط الصادرة، وتعرض الاحتياجات المسودة منفصلة حتى لا تختلط بالرصيد الحر</p></div></div><div class="panel"><div class="toolbar"><div class="toolbar-title">Material Requirements Planning <span class="count">${ov.length}</span></div>${searchInput(`بحث بالمواد أو الكود`)}</div>${table([`المادة`,`Released Stock*`,`Reserved`,`Draft Needs`,`Net Gap`,`Lead Time`,`الإجراء`],ov.map((m)=>`<tr><td><strong>${h(m.name)}</strong><small>${h(m.id)} · ${h(m.unit)}</small></td><td class="num">${n(m.usable,2)}</td><td class="num">${n(m.committed,2)}</td><td class="num">${n(m.planned,2)}</td><td>${m.short?`<span class="negative">${n(m.short,2)} ${h(m.unit)}</span>`:pill(`Covered`,`success`)}</td><td>${n(m.leadDays)} d</td><td><button class="small-action" data-action="add-lot" data-id="${h(m.id)}">إضافة Lot</button></td></tr>`))}</div><div class="hint-card"><strong>مرجع MRP تجريبي</strong><p>*الرصيد Released يحتسب صلاحية اليوم فقط؛ الفحص النهائي لكل أمر إنتاج يعتمد تاريخ بداية الخطة. لا تنشأ أوامر شراء فعلية أو حجوزات مخزنية في هذا النموذج</p></div>`;
  }
  function renderMaster() {
    const tabs=`<div class="tab-bar">${[[`products`,`المنتجات وBOM`],[`materials`,`مواد المخزون`],[`lines`,`خطوط التصنيع`],[`settings`,`إعدادات التخطيط`]].map(([id,title])=>`<button class="tab ${ui.masterTab===id?`active`:``}" data-master="${id}">${title}</button>`).join(``)}</div>`;
    let content=``;
    if(ui.masterTab===`products`) content=`<div class="panel"><div class="panel-head"><div><h3>Product Master</h3><p>Pack conversion · Yield · Batch size · Routing · BOM</p></div>${btn(`+ إضافة منتج`,`add-product`)}</div>${table([`SKU / المنتج`,`Pack → Minor`,`Standard Yield`,`Validated Batch`,`Routing`,`BOM`,`إجراءات`],S().products.map((p)=>`<tr><td><strong>${h(p.sku)}</strong><small>${h(p.name)}</small></td><td>${n(p.packSize)} ${h(p.minorUnit)}</td><td>${n(p.yieldPct,1)}%</td><td class="num">${n(p.batchSize)}</td><td><button class="small-action" data-action="edit-routing" data-id="${h(p.id)}">${p.routing.length} مراحل</button></td><td><button class="small-action" data-action="edit-bom" data-id="${h(p.id)}">${p.bom.length} مواد</button></td><td><button class="small-action accent" data-action="edit-product" data-id="${h(p.id)}">تعديل</button></td></tr>`))}</div>`;
    if(ui.masterTab===`materials`) content=`<div class="panel"><div class="panel-head"><div><h3>Material Master & Lots</h3><p>FEFO eligible inventory with QC status</p></div><div class="inline-btns">${btn(`+ مادة`,`add-material`,`outline`)}${btn(`+ Lot`,`add-lot`)}</div></div><div class="material-cards">${S().materials.map((m)=>`<article class="material-card"><div class="material-top"><div><strong>${h(m.name)}</strong><small>${h(m.id)} · ${h(m.unit)} · Lead ${n(m.leadDays)} d</small></div><button class="small-action" data-action="edit-material" data-id="${h(m.id)}">تعديل</button></div><div class="lot-list">${m.lots.length?m.lots.map((l)=>`<div class="lot-row"><span><b>${h(l.id)}</b><small>EXP ${dateLabel(l.expiry)}</small></span><strong>${n(l.qty,2)}</strong>${pill(l.status,l.status===`RELEASED`?`success`:`warning`)}<button class="lot-remove" data-action="delete-lot" data-id="${h(m.id)}" data-lot="${h(l.id)}" title="حذف Lot">×</button></div>`).join(``):`<p class="quiet">لا توجد لوتات</p>`}</div><button class="full-action" data-action="add-lot" data-id="${h(m.id)}">+ إضافة Lot</button></article>`).join(``)}</div></div>`;
    if(ui.masterTab===`lines`) content=`<div class="panel"><div class="panel-head"><div><h3>Line Capacity</h3><p>ساعات التشغيل المتاحة لكل خط لكل يوم تقويمي</p></div></div>${table([`Line ID`,`الخط / الماكينة`,`Daily Hours`,`Weekly (7d)`,`الإجراء`],S().lines.map((l)=>`<tr><td>${h(l.id)}</td><td><strong>${h(l.name)}</strong></td><td>${n(l.dailyHours,1)} h</td><td>${n(l.dailyHours*7)} h</td><td><button class="small-action accent" data-action="edit-line" data-id="${h(l.id)}">تعديل</button></td></tr>`))}</div>`;
    if(ui.masterTab===`settings`) {const s=S().settings;content=`<div class="settings-grid"><div class="panel settings-panel"><h3>Planning Parameters</h3><p>متغيرات حسابية أولية قابلة للضبط حسب سياسة المصنع</p><div class="settings-list"><div><span>QC Testing Lead Time</span><b>${n(s.qcLeadDays)} days</b></div><div><span>QA Review / Release Lead Time</span><b>${n(s.qaLeadDays)} days</b></div><div><span>Standard Changeover Allowance</span><b>${n(s.defaultCleaningHours)} hours</b></div></div>${btn(`تعديل الإعدادات`,`edit-settings`)}</div><div class="panel caution-panel"><h3>System status</h3><div class="system-stat"><span class="system-led"></span><strong>Local Browser Storage</strong></div><p>Firebase غير موصول حاليا. طبقة التخزين منفصلة ويمكن استبدالها بمصدر بيانات مشترك عند تجهيز المصادقة والصلاحيات وقواعد Firestore</p><button class="btn danger-outline" data-action="reset-data">إعادة ضبط البيانات التجريبية</button></div></div>`;}
    return `${shell(`MASTER DATA / CONFIG`,`البيانات الرئيسية والإعدادات`,`إدارة المنتجات، قوائم المواد، خطوط التصنيع ومعايير التخطيط`)}${tabs}${content}`;
  }
  function renderAudit() {return `${shell(`GOVERNANCE / LOG`,`سجل النشاط`,`تتبع تغييرات الواجهة خلال استخدام النموذج التجريبي`,btn(`تصدير السجل`,`export-audit`,`outline`))}<div class="panel"><div class="audit-list">${S().audit.map((a)=>`<div class="audit-event"><div class="audit-bullet">●</div><div><strong>${h(a.action)}</strong><p>${h(a.subject)} ${a.details?`— ${h(a.details)}`:``}</p></div><time>${new Date(a.at).toLocaleString(`en-GB`)}</time></div>`).join(``)}</div></div>`;}
  const names={dashboard:`Dashboard`,demands:`Demand Planning`,conversions:`Conversion`,constraints:`Constraints`,mps:`Master Production Schedule`,procurement:`MRP Signals`,master:`Master Data`,audit:`Audit Log`};
  function render() {
    const pages={dashboard:renderDashboard,demands:renderDemands,conversions:renderConversions,constraints:renderConstraints,mps:renderMPS,procurement:renderProcurement,master:renderMaster,audit:renderAudit};
    try { $(`#page`).innerHTML=pages[ui.page](); }
    catch(error){console.error(error);$(`#page`).innerHTML=`<div class="render-error"><h2>تعذر عرض الصفحة</h2><p>${h(error.message)}</p></div>`;}
    $(`#breadcrumb`).textContent=names[ui.page];
    $$( `.nav-link[data-page]`).forEach((x)=>x.classList.toggle(`active`,x.dataset.page===ui.page));
    const shortages=E.materialOverview(S()).filter((m)=>m.short>0).length;
    $(`#shortage-pill`).hidden=!shortages;$(`#shortage-pill`).textContent=shortages;
    $(`#today-label`).textContent=new Date().toLocaleDateString(`en-GB`,{day:`2-digit`,month:`short`,year:`numeric`});
  }
  function navigate(page) {ui.page=page;ui.query=``;render(); window.scrollTo({top:0,behavior:`smooth`}); closeMenu();}
  function toast(msg,bad=false) {const el=$(`#toast`);el.textContent=msg;el.className=`toast visible ${bad?`error`:``}`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove(`visible`),3500);}
  function modal(title,body,size=``) {$(`#modal`).innerHTML=`<div class="modal-backdrop" data-action="close-modal"></div><div class="dialog ${size}" role="dialog" aria-modal="true" aria-label="${h(title)}"><div class="modal-head"><h2>${title}</h2><button class="icon-button" data-action="close-modal" aria-label="اغلاق">×</button></div><div class="modal-scroll">${body}</div></div>`;$(`#modal`).classList.add(`open`);document.body.classList.add(`modal-open`);$(`#modal .dialog input:not([type=hidden]), #modal .dialog select`)?.focus();}
  function closeModal() {$(`#modal`).classList.remove(`open`);$(`#modal`).innerHTML=``;document.body.classList.remove(`modal-open`);}
  function formButtons(save=`حفظ`) {return `<div class="modal-actions"><button type="button" class="btn outline" data-action="close-modal">إلغاء</button><button type="submit" class="btn primary">${save}</button></div>`;}
  function openDemand(id=null) {
    const d=id?demand(id):null;
    const today=SP.todayISO();
    modal(d?`تعديل الطلب ${h(d.id)}`:`إنشاء طلب جديد`,`<form data-form="demand" data-id="${h(id || ``)}"><div class="form-grid">${selection(`المنتج *`,`productId`,productOptions(),d?.productId,`required`)}${field(`السوق / الوكيل *`,`market`,`text`,d?.market || `Jordan`,`required maxlength="75"`)}${field(`Forecast (Packs) *`,`forecast`,`number`,d?.forecast ?? 0,`min="0" step="1" required`)}${field(`Firm Orders (Packs) *`,`firmOrders`,`number`,d?.firmOrders ?? 0,`min="0" step="1" required`)}${field(`Available FG Stock`,`fgStock`,`number`,d?.fgStock ?? 0,`min="0" step="1" required`)}${field(`Firm Incoming Receipts`,`incoming`,`number`,d?.incoming ?? 0,`min="0" step="1" required`)}${field(`Safety Stock`,`safety`,`number`,d?.safety ?? 0,`min="0" step="1" required`)}${field(`Agent / Distributor Stock`,`agentStock`,`number`,d?.agentStock ?? 0,`min="0" step="1" required`)}${field(`Historical Offtake (Packs)`,`history`,`number`,d?.history ?? 0,`min="0" step="1" required`)}${field(`Need-by Date *`,`dueDate`,`date`,d?.dueDate || E.isoAdd(today,30),`required`)}${selection(`الأولوية`,`priority`,[{value:`HIGH`,label:`High`},{value:`NORMAL`,label:`Normal`},{value:`LOW`,label:`Low`}],d?.priority || `NORMAL`)}</div><label class="field"><span>ملاحظات</span><textarea name="notes" rows="3">${h(d?.notes || ``)}</textarea></label>${formButtons(d?`حفظ التعديل`:`حفظ الطلب`)}</form>`,`wide`);
  }
  function openPlan(id=null) {
    const unused=S().demands.filter((d)=>!S().plans.some((p)=>p.demandId===d.id));
    const list=id?[demand(id)].filter(Boolean):unused;
    if(!list.length) return toast(`لا توجد طلبات جديدة لإنشاء خطة لها`,true);
    const selected=list[0],calc=E.calculation(selected,product(selected.productId));
    if(!calc?.batches) return toast(`صافي الاحتياج يساوي صفر أو إعدادات المنتج غير صالحة`,true);
    modal(`إنشاء خطة إنتاج MPS`,`<form data-form="plan">${selection(`الطلب المتاح *`,`demandId`,list.map((d)=>({value:d.id,label:`${d.id} — ${product(d.productId)?.sku} — ${d.market}`})),id || selected.id,`required`)}<div class="summary-preview" id="plan-preview">الدفعات المقترحة: <strong>${n(calc.batches)} Batches</strong> · Net ${n(calc.netPacks)} Packs</div><div class="form-grid">${field(`بداية الإنتاج المخططة *`,`startDate`,`date`,SP.todayISO(),`required`)}${field(`تاريخ الحاجة (استرشادي)`,`needBy`,`date`,selected.dueDate,`disabled`)}</div><div class="form-info">سيتم إنشاء مسودة، ولن يصدر أمر الإنتاج حتى يتم فحص المواد والقيود يدويا</div>${formButtons(`إنشاء المسودة`)}</form>`);
  }
  function openProduct(id=null) {
    const p=id?product(id):null;
    modal(p?`تعديل ${h(p.sku)}`:`منتج جديد`,`<form data-form="product" data-id="${h(id || ``)}"><div class="form-grid">${field(`SKU / Product Code *`,`sku`,`text`,p?.sku || ``,`required maxlength="40"`)}${field(`اسم المستحضر *`,`name`,`text`,p?.name || ``,`required maxlength="120"`)}${selection(`Pharmaceutical Form`,`drugForm`,[{value:`TABLET`,label:`Tablet`},{value:`CAPSULE`,label:`Capsule`},{value:`LIQUID`,label:`Liquid`}],p?.form || `TABLET`)}${field(`Minors per Pack *`,`packSize`,`number`,p?.packSize ?? 20,`required step="1" min="1"`)}${field(`Minor Unit *`,`minorUnit`,`text`,p?.minorUnit || `tablet`,`required maxlength="20"`)}${field(`Standard Yield % *`,`yieldPct`,`number`,p?.yieldPct ?? 97,`required min="0.01" max="100" step="0.01"`)}${field(`Validated Batch Size (input minors) *`,`batchSize`,`number`,p?.batchSize ?? 100000,`required min="1" step="1"`)}</div><div class="form-info">يجب تحديد BOM وRouting لكل منتج من شاشة البيانات الرئيسية قبل إصدار أي خطة؛ الإعدادات الافتراضية للمنتج الجديد غير معتمدة</div>${formButtons()}</form>`,`wide`);
  }
  function routeRow(entry={stage:``,lineId:``,hours:1}) {return `<div class="editable-row route-row"><input aria-label="اسم المرحلة" name="stage" placeholder="Stage name" value="${h(entry.stage)}" required maxlength="60"><select aria-label="خط الإنتاج" name="lineId" required>${S().lines.map((l)=>option(l.id,l.name,entry.lineId)).join(``)}</select><input aria-label="الساعات لكل باتش" name="hours" type="number" min="0.1" max="1000" step="0.1" value="${h(entry.hours)}" required><button type="button" class="remove-row" data-action="remove-edit-row">×</button></div>`;}
  function openRouting(id) {const p=product(id);if(!p)return;modal(`Routing · ${h(p.sku)}`,`<form data-form="routing" data-id="${h(id)}"><div class="row-labels"><span>المرحلة</span><span>الخط / الماكينة</span><span>Hours / Batch</span></div><div id="route-rows" class="editable-rows">${p.routing.map(routeRow).join(``)}</div><button class="btn outline minor-btn" type="button" data-action="add-route-row">+ إضافة مرحلة</button>${formButtons()}</form>`,`wide`);}
  function bomRow(entry={materialId:``,qty:1}) {return `<div class="editable-row bom-row"><select aria-label="المادة" name="materialId" required>${S().materials.map((m)=>option(m.id,`${m.name} (${m.unit})`,entry.materialId)).join(``)}</select><input aria-label="الكمية لكل باتش" name="qty" type="number" min="0.00001" step="any" value="${h(entry.qty)}" required><button type="button" class="remove-row" data-action="remove-edit-row">×</button></div>`;}
  function openBOM(id) {const p=product(id);if(!p)return;modal(`Bill of Materials · ${h(p.sku)}`,`<form data-form="bom" data-id="${h(id)}"><p class="field-help">الكميات المعرفة تمثل استهلاك المادة لكل Batch واحد، حسب وحدة المادة</p><div class="row-labels bom-labels"><span>المادة</span><span>الكمية لكل Batch</span></div><div id="bom-rows" class="editable-rows">${p.bom.map(bomRow).join(``)}</div><button class="btn outline minor-btn" type="button" data-action="add-bom-row">+ إضافة مادة</button>${formButtons()}</form>`,`wide`);}
  function openMaterial(id=null) {const m=id?E.byId(S().materials,id):null;modal(m?`تعديل ${h(id)}`:`إضافة مادة خام أو تغليف`,`<form data-form="material" data-id="${h(id || ``)}"><div class="form-grid">${field(`Material Code *`,`code`,`text`,m?.id || ``,`required maxlength="40" ${m?`readonly`:``}`)}${field(`Material Name *`,`name`,`text`,m?.name || ``,`required maxlength="90"`)}${field(`Unit (kg, piece...) *`,`unit`,`text`,m?.unit || `kg`,`required maxlength="20"`)}${field(`Lead Time (days)`,`leadDays`,`number`,m?.leadDays ?? 14,`min="0" step="1" required`)}</div>${formButtons()}</form>`);}
  function openLot(id=null) {modal(`إضافة Lot للمخزون`,`<form data-form="lot"><div class="form-grid">${selection(`المادة *`,`materialId`,S().materials.map((m)=>({value:m.id,label:`${m.id} — ${m.name}`})),id || S().materials[0]?.id,`required`)}${field(`Lot / Batch Number *`,`lotNo`,`text`,`` ,`required maxlength="60"`)}${field(`Quantity *`,`qty`,`number`,`1`,`required min="0.00001" step="any"`)}${field(`Expiry Date *`,`expiry`,`date`,E.isoAdd(SP.todayISO(),365),`required`)}${selection(`QC / Stock Status`,`status`,[{value:`RELEASED`,label:`Released / Approved`},{value:`QUARANTINE`,label:`Quarantine`},{value:`REJECTED`,label:`Rejected`}],`QUARANTINE`)}</div><div class="form-info">تغيير حالة اللوت إلى Released في هذا النموذج هو إدخال تجريبي ولا يمثل تصريحا فعليا من قسم الجودة</div>${formButtons(`إضافة Lot`)}</form>`);}
  function openLine(id) {const l=line(id);if(!l)return;modal(`تعديل طاقة ${h(l.name)}`,`<form data-form="line" data-id="${h(id)}">${field(`Available Line Hours per Calendar Day`,`dailyHours`,`number`,l.dailyHours,`required min="0.1" max="24" step="0.1"`)}<div class="form-info">نموذج الجدولة يستخدم الأيام التقويمية بدون تقويم عطلات؛ لا تعتمد الجدولة تجاريا إلا بعد تخصيص الوردية والإيقافات المخططة</div>${formButtons()}</form>`);}
  function openSettings() {const s=S().settings;modal(`إعدادات التخطيط`,`<form data-form="settings"><div class="form-grid">${field(`QC Lead Time (days)`,`qcLeadDays`,`number`,s.qcLeadDays,`min="0" max="120" step="1" required`)}${field(`QA Lead Time (days)`,`qaLeadDays`,`number`,s.qaLeadDays,`min="0" max="120" step="1" required`)}${field(`Changeover (hours)`,`defaultCleaningHours`,`number`,s.defaultCleaningHours,`min="0" max="120" step="0.1" required`)}</div>${formButtons()}</form>`);}
  function openImport() {modal(`استيراد الطلبات من CSV`,`<div class="import-panel"><p>حمّل الملف النموذجي، وأبقِ أسماء الأعمدة الإنجليزية كما هي. سيتم التحقق من كل سطر قبل الإضافة</p><div class="import-actions"><button class="btn outline" data-action="download-template">تنزيل قالب CSV</button></div><label class="upload-target">اختر ملف CSV من جهازك<input type="file" id="csv-file" accept=".csv,text/csv"></label><small>الأعمدة: product_sku, market, forecast_packs, firm_orders_packs, fg_stock_packs, incoming_packs, safety_packs, agent_stock_packs, historical_packs, due_date, priority, notes</small></div>`);}
  function planDetails(id) {
    const p=E.byId(S().plans,id);if(!p)return;
    const x=E.constraints(S(),p),pr=product(p.productId),d=demand(p.demandId),timeline=x.timeline,status=computedStatus(p,x);
    const buttons=[];
    if(p.status===`DRAFT`) {buttons.push(btn(`تعديل التاريخ`,`edit-plan-date`,`outline`,`data-id="${h(id)}"`));if(x.ready)buttons.push(btn(`إصدار MPS`,`release-plan`,`primary`,`data-id="${h(id)}"`));}
    else if(p.status===`RELEASED`) buttons.push(btn(`تسجيل بدء الإنتاج`,`start-production`,`primary`,`data-id="${h(id)}"`));
    else if(p.status===`IN_PRODUCTION`) buttons.push(btn(`اكتمال التصنيع / إلى QC`,`finish-production`,`primary`,`data-id="${h(id)}"`));
    else if(p.status===`QUARANTINE`) buttons.push(btn(`تسجيل اجتياز QC`,`pass-qc`,`primary`,`data-id="${h(id)}"`));
    else if(p.status===`QC_PASSED`) buttons.push(btn(`تسجيل إفراج QA`,`release-qa`,`primary`,`data-id="${h(id)}"`));
    const materials=x.materials.map((m)=>`<tr><td><strong>${h(m.materialName)}</strong><small>${h(m.materialId)} · ${h(m.unit)}</small></td><td>${n(m.need,2)}</td><td>${n(m.available,2)}</td><td>${m.short?`<span class="negative">${n(m.short,2)}</span>`:pill(`Covered`,`success`)}</td><td><small>${m.lots.map((l)=>`${h(l.id)}: ${n(l.qty,2)}`).join(`<br>` ) || `—`}</small></td></tr>`);
    const routing=timeline?.steps?.map((st)=>`<tr><td>${n(st.batch)}</td><td>${h(st.stage)}</td><td>${h(st.lineName)}</td><td>${n(st.hours,1)} h ${st.cleaning?pill(`+${n(st.cleaning)}h clean`,`warning`):``}</td><td>${dateLabel(st.start)} → ${dateLabel(st.end)}</td></tr>`) || [];
    modal(`MPS · ${h(p.id)}`,`<div class="plan-details"><div class="detail-title"><div><span class="overline">${h(pr?.sku)} · ${h(d?.market)}</span><h3>${h(pr?.name)}</h3></div>${pill(statusName[status],statusTone[status])}</div><div class="detail-kpis"><div><small>BATCHES</small><strong>${n(p.batches)}</strong></div><div><small>NET PACKS</small><strong>${n(x.calc?.netPacks)}</strong></div><div><small>START</small><strong>${dateLabel(p.startDate)}</strong></div><div><small>QA ESTIMATE</small><strong>${dateLabel(timeline?.releaseDate)}</strong></div></div>${timeline?.late?`<div class="risk-banner">تاريخ الإفراج المتوقع بعد تاريخ الحاجة ${dateLabel(p.dueDate)} — يلزم تقييم التأخير</div>`:``}${!x.ready&&p.status===`DRAFT`?`<div class="risk-banner">لا يمكن إصدار MPS: ${x.shortages.length?`${n(x.shortages.length)} نقص مواد`:`المسار أو المدخلات بحاجة لمراجعة`}</div>`:``}<div class="modal-section"><h3>01 — Material Availability & FEFO</h3>${table([`Material`,`Required`,`Available*`,`Gap`,`Proposed FEFO Lots`],materials)}</div><div class="modal-section"><h3>02 — Routing & Machine Slots</h3>${routing.length?table([`Batch`,`Stage`,`Machine`,`Hours`,`Date`],routing):empty(`لا توجد عمليات`,`راجع إعدادات المنتج`)}</div><div class="detail-footnotes"><p>● Bottleneck: <b>${h(timeline?.bottleneck?.stage || `—`)} / ${h(timeline?.bottleneck?.line || `—`)}</b></p><p>● Cleaning allowance: <b>${n(timeline?.cleaningTotal || 0,1)} h</b></p><p>● QC planned by: <b>${dateLabel(timeline?.qcDate)}</b> | QA estimated: <b>${dateLabel(timeline?.releaseDate)}</b></p><p>● *المخزون المعروض متاح نظريا بعد خصم الالتزامات الأخرى، وليس حجز Lot فعليا</p></div><div class="modal-actions">${btn(`إغلاق`,`close-modal`,`outline`)}${buttons.join(``)}</div></div>`,`large`);
  }
  function readForm(form,keys) {return Object.fromEntries(keys.map((key)=>[key,form.elements.namedItem(key)?.value?.trim?.() ?? ``]));}
  function ensureNonnegative(o,keys) {for(const key of keys){if(!Number.isFinite(Number(o[key])) || Number(o[key])<0 || !Number.isInteger(Number(o[key])))throw new Error(`${key}: أدخل عددا صحيحا أكبر أو يساوي صفر`);o[key]=Number(o[key]);}}
  function doSubmit(form) {
    const formType=form.dataset.form,id=form.dataset.id;
    if(!form.reportValidity())return;
    try {
      if(formType===`demand`) {
        const item=readForm(form,[`productId`,`market`,`forecast`,`firmOrders`,`fgStock`,`incoming`,`safety`,`agentStock`,`history`,`dueDate`,`priority`,`notes`]);
        ensureNonnegative(item,[`forecast`,`firmOrders`,`fgStock`,`incoming`,`safety`,`agentStock`,`history`]);
        if(!product(item.productId))throw new Error(`المنتج غير موجود`);
        Store.mutate(id?`تعديل طلب`:`إنشاء طلب`,id || item.market,(s)=>{
          if(id){
            if(s.plans.some((x)=>x.demandId===id&&x.status!==`DRAFT`)) throw new Error(`لا يمكن تغيير طلب مرتبط بخطة MPS صادرة`);
            const original=E.byId(s.demands,id);Object.assign(original,item);
            const c=E.calculation(original,E.byId(s.products,original.productId));
            for(const plan of s.plans.filter((x)=>x.demandId===id&&x.status===`DRAFT`)){plan.productId=original.productId;plan.batches=c.batches;plan.dueDate=original.dueDate;}
          }else{s.demands.unshift({...item,id:Store.uid(`DEM`),createdAt:new Date().toISOString()});}
        });
      } else if(formType===`plan`) {
        const {demandId,startDate}=readForm(form,[`demandId`,`startDate`]);
        const d=demand(demandId),p=product(d?.productId),calc=E.calculation(d,p);
        if(!calc?.batches)throw new Error(`هذا الطلب لا يحتاج تشغيلات حاليا`);
        if(S().plans.some((x)=>x.demandId===demandId))throw new Error(`توجد خطة بالفعل لهذا الطلب`);
        if(!p.bom.length || !p.routing.length)throw new Error(`يرجى ضبط BOM وRouting أولاً`);
        Store.mutate(`إنشاء مسودة MPS`,demandId,(s)=>s.plans.unshift({id:Store.uid(`MPS`),demandId,productId:p.id,batches:calc.batches,startDate,dueDate:d.dueDate,status:`DRAFT`,createdAt:new Date().toISOString()}));
        ui.page=`mps`;
      } else if(formType===`product`) {
        const item=readForm(form,[`sku`,`name`,`drugForm`,`packSize`,`minorUnit`,`yieldPct`,`batchSize`]);
        if(!Number.isInteger(+item.packSize)||+item.packSize<1||!Number.isInteger(+item.batchSize)||+item.batchSize<1)throw new Error(`أحجام الوحدات والباتش يجب أن تكون أعدادا صحيحة موجبة`);
        if(!Number.isFinite(+item.yieldPct)||+item.yieldPct<=0||+item.yieldPct>100)throw new Error(`Yield يجب أن يكون أكبر من صفر وحتى 100%`);
        if(S().products.some((p)=>p.sku.toUpperCase()===item.sku.toUpperCase()&&p.id!==id))throw new Error(`SKU مستخدم مسبقا`);
        const v={sku:item.sku,name:item.name,form:item.drugForm,packSize:+item.packSize,minorUnit:item.minorUnit,yieldPct:+item.yieldPct,batchSize:+item.batchSize};
        Store.mutate(id?`تعديل Master Product`:`إنشاء منتج جديد`,item.sku,(s)=>{if(id){if(s.plans.some((p)=>p.productId===id&&p.status!==`DRAFT`))throw new Error(`لا يمكن تعديل منتج مرتبط بخطة صادرة في هذا النموذج`);Object.assign(E.byId(s.products,id),v);
          for(const plan of s.plans.filter((x)=>x.productId===id&&x.status===`DRAFT`)){
            const d=E.byId(s.demands,plan.demandId);
            plan.batches=E.calculation(d,E.byId(s.products,id)).batches;
          }
          }else{s.products.push({id:Store.uid(`PRD`),...v,routing:[],bom:[]});}});ui.masterTab=`products`;
      } else if(formType===`routing`) {
        const routing=$$(`.route-row`,form).map((row)=>({stage:$(`[name=stage]`,row).value.trim(),lineId:$(`[name=lineId]`,row).value,hours:+$(`[name=hours]`,row).value}));
        if(!routing.length || routing.some((r)=>!r.stage||!line(r.lineId)||!(r.hours>0)))throw new Error(`كل مرحلة تتطلب اسم وخط وساعات تشغيل موجبة`);
        Store.mutate(`تعديل مسار الإنتاج`,id,(s)=>{if(s.plans.some((p)=>p.productId===id&&p.status!==`DRAFT`))throw new Error(`يجب إصدار نسخة Master Data جديدة إذا كانت هناك خطة صادرة`);E.byId(s.products,id).routing=routing;});
      } else if(formType===`bom`) {
        const bom=$$(`.bom-row`,form).map((row)=>({materialId:$(`[name=materialId]`,row).value,qty:+$(`[name=qty]`,row).value}));
        if(!bom.length || bom.some((x)=>!(x.qty>0))||new Set(bom.map((x)=>x.materialId)).size!==bom.length)throw new Error(`يجب إضافة مواد بكميات موجبة دون تكرار الكود`);
        Store.mutate(`تعديل BOM`,id,(s)=>{if(s.plans.some((p)=>p.productId===id&&p.status!==`DRAFT`))throw new Error(`لا يمكن تعديل BOM مرتبط بخطة صادرة`);E.byId(s.products,id).bom=bom;});
      } else if(formType===`material`) {
        const {code,name,unit,leadDays}=readForm(form,[`code`,`name`,`unit`,`leadDays`]);
        if(!Number.isInteger(+leadDays)||+leadDays<0)throw new Error(`Lead Time يجب أن يكون عددا صحيحا غير سالب`);
        if(!id&&E.byId(S().materials,code))throw new Error(`Material Code موجود مسبقا`);
        Store.mutate(id?`تعديل مادة`:`إنشاء مادة`,code,(s)=>{if(id)Object.assign(E.byId(s.materials,id),{name,unit,leadDays:+leadDays});else s.materials.push({id:code,name,unit,leadDays:+leadDays,lots:[]});});
      } else if(formType===`lot`) {
        const item=readForm(form,[`materialId`,`lotNo`,`qty`,`expiry`,`status`]);
        if(!(Number(item.qty)>0)||!Number.isFinite(Number(item.qty)))throw new Error(`كمية اللوت يجب أن تكون موجبة`);
        const m=E.byId(S().materials,item.materialId);if(!m||m.lots.some((x)=>x.id===item.lotNo))throw new Error(`المادة غير موجودة أو رقم اللوت مكرر`);
        Store.mutate(`إضافة Lot`,`${item.materialId} / ${item.lotNo}`,(s)=>E.byId(s.materials,item.materialId).lots.push({id:item.lotNo,qty:+item.qty,expiry:item.expiry,status:item.status}));
      } else if(formType===`line`) {
        const hours=+form.elements.namedItem(`dailyHours`).value;
        if(!(hours>0&&hours<=24))throw new Error(`يجب تحديد طاقة أكبر من صفر وحتى 24 ساعة`);
        Store.mutate(`تحديث سعة الخط`,id,(s)=>E.byId(s.lines,id).dailyHours=hours);
      } else if(formType===`settings`) {
        const input=readForm(form,[`qcLeadDays`,`qaLeadDays`,`defaultCleaningHours`]);
        if([`qcLeadDays`,`qaLeadDays`].some((k)=>!Number.isInteger(+input[k])||+input[k]<0)||+input.defaultCleaningHours<0||!Number.isFinite(+input.defaultCleaningHours))throw new Error(`قيمة إعداد غير صالحة`);
        Store.mutate(`تعديل إعدادات التخطيط`,`Parameters`,(s)=>Object.assign(s.settings,Object.fromEntries(Object.entries(input).map(([k,v])=>[k,+v]))));
      }
      closeModal();ui.query=``;render();toast(Store.repository.persistent?`تم الحفظ في البيانات المحلية`:`تم الحفظ مؤقتا لهذه الجلسة`);
    } catch(err){toast(err.message,true);}
  }
  function changePlan(id,next) {
    const p=E.byId(S().plans,id);if(!p)return;
    const permitted={RELEASED:`DRAFT`,IN_PRODUCTION:`RELEASED`,QUARANTINE:`IN_PRODUCTION`,QC_PASSED:`QUARANTINE`,QA_RELEASED:`QC_PASSED`};
    if(permitted[next]!==p.status) return toast(`انتقال غير مسموح`,true);
    if(next===`RELEASED`&&!E.constraints(S(),p).ready) return toast(`لا يمكن إصدار خطة فيها نقص مواد أو بيانات ناقصة`,true);
    const message={RELEASED:`إصدار MPS`,IN_PRODUCTION:`بدء الإنتاج`,QUARANTINE:`اكتمال الإنتاج ونقله إلى QC`,QC_PASSED:`تسجيل اجتياز QC`,QA_RELEASED:`تسجيل إفراج QA`}[next];
    if(!confirm(`${message}؟\nهذا تسجيل تجريبي وليس اعتمادا نظاميا أو توقيعا إلكترونيا`))return;
    try{Store.mutate(message,id,(s)=>{E.byId(s.plans,id).status=next;});closeModal();render();planDetails(id);toast(message);}catch(err){toast(err.message,true);}
  }
  function editPlanDate(id) {const p=E.byId(S().plans,id);if(!p || p.status!==`DRAFT`)return;modal(`تغيير تاريخ MPS`,`<form data-form="plan-date" data-id="${h(id)}">${field(`Planned Start`,`startDate`,`date`,p.startDate,`required`)}${formButtons()}</form>`);}
  // Uses RFC 4180 quoting rules; CSV import is template-driven and checked row-by-row.
  function parseCSV(text) {
    const out=[];let row=[],value=``,quoted=false;
    for(let i=0;i<text.length;i++) {const c=text[i];if(c===`"`){if(quoted&&text[i+1]===`"`){value+=`"`;i++;}else quoted=!quoted;}else if(c===`,`&&!quoted){row.push(value);value=``;}else if((c===`\n`||c===`\r`)&&!quoted){if(c===`\r`&&text[i+1]===`\n`)i++;row.push(value);value=``;if(row.some((s)=>s.trim()))out.push(row);row=[];}else value+=c;}
    if(quoted)throw new Error(`CSV يحوي علامة اقتباس غير مغلقة`);
    row.push(value);if(row.some((s)=>s.trim()))out.push(row);
    return out;
  }
  function downloadCSV(filename,heads,rows) {
    const encode=(value)=>`"${String(value ?? ``).replace(/"/g,`""`)}"`;
    const csv=`\uFEFF${[heads,...rows].map((row)=>row.map(encode).join(`,`)).join(`\r\n`)}`;
    const blob=new Blob([csv],{type:`text/csv;charset=utf-8`}),url=URL.createObjectURL(blob);
    const link=document.createElement(`a`);link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function downloadTemplate() {downloadCSV(`supplyflow_demand_template.csv`,[`product_sku`,`market`,`forecast_packs`,`firm_orders_packs`,`fg_stock_packs`,`incoming_packs`,`safety_packs`,`agent_stock_packs`,`historical_packs`,`due_date`,`priority`,`notes`],[[S().products[0]?.sku || ``,`Jordan`,`14000`,`11000`,`1800`,`1000`,`800`,`6500`,`12000`,E.isoAdd(SP.todayISO(),30),`HIGH`,`Example`]]);}
  function exportMPS() {const checks=allChecks();downloadCSV(`MPS_${SP.todayISO()}.csv`,[`MPS_ID`,`Demand_ID`,`SKU`,`Market`,`Batches`,`Start_Date`,`Estimated_QA_Release`,`Due_Date`,`Status`,`Material_Shortages`,`Late_Risk`],checks.map((c)=>[c.plan.id,c.plan.demandId,product(c.plan.productId)?.sku,demand(c.plan.demandId)?.market,c.plan.batches,c.plan.startDate,c.timeline?.releaseDate,c.plan.dueDate,computedStatus(c.plan,c),c.shortages.length,c.timeline?.late?`Yes`:`No`]));}
  function exportMRP() {downloadCSV(`MRP_${SP.todayISO()}.csv`,[`Material_ID`,`Material`,`Unit`,`Released_Stock`,`Committed`,`Draft_Need`,`Shortage`,`Lead_Days`],E.materialOverview(S()).map((m)=>[m.id,m.name,m.unit,m.usable,m.committed,m.planned,m.short,m.leadDays]));}
  function exportAudit() {downloadCSV(`Audit_${SP.todayISO()}.csv`,[`Date_Time`,`Action`,`Subject`,`Details`],S().audit.map((a)=>[a.at,a.action,a.subject,a.details]));}
  function importCSV(file) {
    if(!file)return;
    if(file.size>2*1024*1024)return toast(`الحد الأقصى للملف 2 MB`,true);
    const reader=new FileReader();
    reader.onload=()=>{
      try {
        const raw=String(reader.result || ``).replace(/^\uFEFF/,``),rows=parseCSV(raw);
        if(rows.length<2)throw new Error(`الملف لا يحتوي طلبات`);
        const headers=rows.shift().map((x)=>x.trim().toLowerCase()), expected=[`product_sku`,`market`,`forecast_packs`,`firm_orders_packs`,`fg_stock_packs`,`incoming_packs`,`safety_packs`,`agent_stock_packs`,`historical_packs`,`due_date`,`priority`,`notes`];
        if(expected.some((x)=>!headers.includes(x)))throw new Error(`أعمدة CSV لا تطابق القالب`);
        if(rows.length>1000)throw new Error(`الحد الأقصى 1000 طلب في الملف الواحد`);
        const incoming=rows.map((row,i)=>{
          const v=Object.fromEntries(headers.map((header,k)=>[header,(row[k] || ``).trim()]));
          const p=S().products.find((prod)=>prod.sku===v.product_sku);
          if(!p)throw new Error(`السطر ${i+2}: SKU غير معرف (${v.product_sku})`);
          if(!v.market||!/^(\d{4})-(\d{2})-(\d{2})$/.test(v.due_date)||Number.isNaN(new Date(`${v.due_date}T12:00:00`).getTime()))throw new Error(`السطر ${i+2}: السوق أو التاريخ غير صالح`);
          const item={productId:p.id,market:v.market,forecast:v.forecast_packs,firmOrders:v.firm_orders_packs,fgStock:v.fg_stock_packs,incoming:v.incoming_packs,safety:v.safety_packs,agentStock:v.agent_stock_packs,history:v.historical_packs,dueDate:v.due_date,priority:v.priority || `NORMAL`,notes:v.notes || ``};
          ensureNonnegative(item,[`forecast`,`firmOrders`,`fgStock`,`incoming`,`safety`,`agentStock`,`history`]);
          if(![`HIGH`,`NORMAL`,`LOW`].includes(item.priority))throw new Error(`السطر ${i+2}: Priority غير صالح`);
          return {...item,id:Store.uid(`DEM`),createdAt:new Date().toISOString()};
        });
        Store.mutate(`استيراد طلبات CSV`,`${incoming.length} rows`,(s)=>s.demands.unshift(...incoming));closeModal();render();toast(`تم استيراد ${incoming.length} طلب بنجاح`);
      }catch(err){toast(err.message,true);}
    };
    reader.onerror=()=>toast(`تعذر قراءة ملف CSV`,true);
    reader.readAsText(file,`UTF-8`);
  }
  function handleAction(el) {
    const a=el.dataset.action,id=el.dataset.id;
    if(a===`close-modal`){closeModal();return;}
    if(a===`goto-mps`)return navigate(`mps`);
    if(a===`goto-demands`)return navigate(`demands`);
    if(a===`goto-master`)return navigate(`master`);
    if(a===`add-demand`)return openDemand();
    if(a===`edit-demand`)return openDemand(id);
    if(a===`add-plan`||a===`plan-demand`)return openPlan(a===`plan-demand`?id:null);
    if(a===`view-plan`)return planDetails(id);
    if(a===`edit-plan-date`)return editPlanDate(id);
    if(a===`release-plan`)return changePlan(id,`RELEASED`);
    if(a===`start-production`)return changePlan(id,`IN_PRODUCTION`);
    if(a===`finish-production`)return changePlan(id,`QUARANTINE`);
    if(a===`pass-qc`)return changePlan(id,`QC_PASSED`);
    if(a===`release-qa`)return changePlan(id,`QA_RELEASED`);
    if(a===`add-product`||a===`edit-product`)return openProduct(a===`edit-product`?id:null);
    if(a===`edit-routing`)return openRouting(id);
    if(a===`edit-bom`)return openBOM(id);
    if(a===`add-route-row`) {const t=$(`#route-rows`);t.insertAdjacentHTML(`beforeend`,routeRow());return;}
    if(a===`add-bom-row`) {const t=$(`#bom-rows`);t.insertAdjacentHTML(`beforeend`,bomRow());return;}
    if(a===`remove-edit-row`) {el.closest(`.editable-row`).remove();return;}
    if(a===`add-material`||a===`edit-material`)return openMaterial(a===`edit-material`?id:null);
    if(a===`add-lot`)return openLot(id);
    if(a===`delete-lot`) {const mat=E.byId(S().materials,id),lot=mat?.lots.find((l)=>l.id===el.dataset.lot);if(!lot||!confirm(`حذف اللوت ${lot.id} من البيانات التجريبية؟`))return;try{Store.mutate(`حذف Lot`,`${id} / ${lot.id}`,(s)=>{E.byId(s.materials,id).lots=E.byId(s.materials,id).lots.filter((l)=>l.id!==lot.id);});render();toast(`تم الحذف`);}catch(err){toast(err.message,true);}return;}
    if(a===`edit-line`)return openLine(id);
    if(a===`edit-settings`)return openSettings();
    if(a===`open-import`)return openImport();
    if(a===`download-template`)return downloadTemplate();
    if(a===`export-mps`)return exportMPS();
    if(a===`export-mrp`)return exportMRP();
    if(a===`export-audit`)return exportAudit();
    if(a===`reset-data`) {if(confirm(`مسح كل تعديلات هذا المتصفح وإعادة البيانات التجريبية؟`)){Store.reset();closeModal();navigate(`dashboard`);toast(`أعيدت البيانات التجريبية`);}return;}
  }
  function closeMenu() {$(`#sidebar`).classList.remove(`mobile-open`);$(`#mobile-backdrop`).classList.remove(`visible`);}
  document.addEventListener(`click`,(event)=>{
    const page=event.target.closest(`[data-page]`),tab=event.target.closest(`[data-master]`),action=event.target.closest(`[data-action]`);
    if(action){handleAction(action);return;}
    if(page){navigate(page.dataset.page);return;}
    if(tab){ui.masterTab=tab.dataset.master;render();return;}
    if(event.target.closest(`#menu-toggle`)){$(`#sidebar`).classList.toggle(`mobile-open`);$(`#mobile-backdrop`).classList.toggle(`visible`);return;}
    if(event.target.closest(`#mobile-backdrop`))closeMenu();
  });
  document.addEventListener(`submit`,(event)=>{
    const form=event.target.closest(`[data-form]`);if(!form)return;event.preventDefault();
    if(form.dataset.form===`plan-date`){const id=form.dataset.id;const startDate=form.elements.namedItem(`startDate`).value;try{Store.mutate(`تغيير تاريخ إنتاج`,id,(s)=>E.byId(s.plans,id).startDate=startDate);closeModal();render();planDetails(id);toast(`تم تعديل التاريخ`);}catch(err){toast(err.message,true);}return;}
    doSubmit(form);
  });
  document.addEventListener(`change`,(event)=>{
    if(event.target.id===`csv-file`){importCSV(event.target.files?.[0]);return;}
    if(event.target.name===`demandId`&&event.target.closest(`[data-form=plan]`)){
      const d=demand(event.target.value),c=E.calculation(d,product(d?.productId));
      $(`#plan-preview`).innerHTML=`الدفعات المقترحة: <strong>${n(c?.batches)} Batches</strong> · Net ${n(c?.netPacks)} Packs`;
      const fieldEl=event.target.form.elements.namedItem(`needBy`);if(fieldEl)fieldEl.value=d?.dueDate || ``;
    }
  });
  document.addEventListener(`input`,(event)=>{
    if(event.target.id===`search-input`){const selection=event.target.selectionStart;ui.query=event.target.value;render();const input=$(`#search-input`);if(input){input.focus();input.setSelectionRange(selection,selection);}}
  });
  document.addEventListener(`keydown`,(event)=>{if(event.key===`Escape`){closeModal();closeMenu();}});
  render();
})();
