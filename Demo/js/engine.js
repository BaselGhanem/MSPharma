(function () {
  const SP = window.SP = window.SP || {};
  const num = (n) => Math.max(0, Number(n) || 0);
  const round = (n, digits = 2) => Math.round((n + Number.EPSILON) * 10**digits) / 10**digits;
  const byId = (items, id) => items.find((row) => row.id === id);
  const isoAdd = (iso, offset) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,`0`)}-${String(d.getDate()).padStart(2,`0`)}`; };
  const required = (d) => { const gross = Math.max(num(d.forecast),num(d.firmOrders)); return {gross, netPacks:Math.max(0,gross + num(d.safety) - num(d.fgStock) - num(d.incoming))}; };
  const calculation = (d, p) => {
    if (!d || !p) return null;
    const x = required(d), packSize = num(p.packSize), batchSize = num(p.batchSize), yieldRatio = num(p.yieldPct)/100;
    const netMinors = x.netPacks * packSize;
    const yieldAdjustedInput = yieldRatio ? Math.ceil(netMinors / yieldRatio) : 0;
    const batches = batchSize && yieldRatio ? Math.ceil(yieldAdjustedInput / batchSize) : 0;
    const inputMinors = batches * batchSize;
    const outputMinors = Math.floor(inputMinors * yieldRatio);
    const theoreticalPacks = packSize ? Math.floor(outputMinors / packSize) : 0;
    return {...x,netMinors,yieldAdjustedInput,batches,inputMinors,outputMinors,theoreticalPacks,surplusPacks: Math.max(0,theoreticalPacks-x.netPacks)};
  };
  const lotIsUsable = (lot, useDate) => lot.status === `RELEASED` && lot.expiry >= useDate;
  const releasedReservations = (state, excludedPlanId = null) => {
    const result = {};
    for (const plan of state.plans) {
      if (plan.id === excludedPlanId || ![`RELEASED`,`IN_PRODUCTION`,`QUARANTINE`,`QC_PASSED`,`QA_RELEASED`].includes(plan.status)) continue;
      const product = byId(state.products, plan.productId);
      if (!product) continue;
      for (const item of product.bom) result[item.materialId] = (result[item.materialId] || 0) + num(item.qty) * num(plan.batches);
    }
    return result;
  };
  const materialCheck = (state, plan, excludeSelf = true) => {
    const p = byId(state.products, plan.productId);
    if (!p) return [];
    const reservations = releasedReservations(state, excludeSelf ? plan.id : null);
    return p.bom.map((row) => {
      const m = byId(state.materials, row.materialId), need = num(row.qty) * num(plan.batches);
      const eligible = [...(m?.lots || [])].filter((lot) => lotIsUsable(lot, plan.startDate)).sort((a,b) => a.expiry.localeCompare(b.expiry));
      const usable = eligible.reduce((s, lot) => s + num(lot.qty), 0);
      const committed = reservations[row.materialId] || 0;
      const available = Math.max(0, usable - committed), short = Math.max(0, need - available);
      let rest = Math.min(need,available), skippedReservations = committed;
      const lots = [];
      for (const lot of eligible) {
        const afterReservations = Math.max(0,lot.qty - skippedReservations);
        skippedReservations = Math.max(0,skippedReservations-lot.qty);
        const take = Math.min(rest,afterReservations);
        if(take) lots.push({id:lot.id,expiry:lot.expiry,qty:round(take,3)});
        rest = Math.max(0,rest-take);
      }
      return {materialId:row.materialId,materialName:m?.name || row.materialId,unit:m?.unit || `unit`,need,usable,committed,available,short,lots,leadDays:m?.leadDays || 0};
    });
  };
  // Finite-capacity demonstration model: hours allocated to day buckets; intermediate steps may span days.
  // It is indicative planning, not a validated scheduling/production execution algorithm.
  const scheduleAll = (state) => {
    const plans = [...state.plans].filter((p) => p.status !== `CANCELLED`).sort((a,b) => a.startDate.localeCompare(b.startDate) || (a.createdAt || ``).localeCompare(b.createdAt || ``));
    const booked = {}, lastProductOnLine = {}, summary = {};
    const lineMap = Object.fromEntries(state.lines.map((l) => [l.id,l]));
    for (const plan of plans) {
      const p = byId(state.products,plan.productId);
      if (!p) continue;
      const steps = []; let finish = plan.startDate, cleaningTotal = 0, failed = false;
      for(let batch=1; batch<=num(plan.batches);batch++) {
        let readyDay = plan.startDate;
        for(const stage of p.routing) {
          const line = lineMap[stage.lineId];
          if (!line || num(line.dailyHours) === 0) { failed=true;break; }
          const cleaning = lastProductOnLine[stage.lineId] && lastProductOnLine[stage.lineId] !== p.id ? num(state.settings.defaultCleaningHours) : 0;
          const hoursTotal = num(stage.hours) + cleaning;
          let remaining = hoursTotal, day = readyDay, firstDate = null, lastDate = null, guard = 0;
          while(remaining > 0.000001 && guard++ < 1000) {
            const key = `${stage.lineId}|${day}`, used = booked[key] || 0;
            const remainingCapacity = Math.max(0,num(line.dailyHours)-used);
            if (remainingCapacity > 0) {
              const allocate = Math.min(remaining,remainingCapacity);
              booked[key] = used + allocate;
              remaining -= allocate;
              firstDate ||= day; lastDate = day;
            }
            if(remaining > 0.000001) day=isoAdd(day,1);
          }
          if(remaining>0.000001) {failed=true;break;}
          cleaningTotal += cleaning;
          steps.push({batch,stage:stage.stage,lineId:stage.lineId,lineName:line.name,start:firstDate || day,end:lastDate || day,hours:round(hoursTotal),cleaning});
          readyDay = lastDate || readyDay;
          lastProductOnLine[stage.lineId] = p.id;
        }
        if (failed) break;
        finish = readyDay > finish ? readyDay : finish;
      }
      const qcDate = isoAdd(finish,num(state.settings.qcLeadDays));
      const releaseDate = isoAdd(qcDate,num(state.settings.qaLeadDays));
      const bottleneck = [...p.routing].sort((a,b) => (b.hours / (lineMap[b.lineId]?.dailyHours || 1)) - (a.hours / (lineMap[a.lineId]?.dailyHours || 1)))[0];
      summary[plan.id] = {steps,finish,qcDate,releaseDate,late:releaseDate > plan.dueDate,cleaningTotal,failed,bottleneck:bottleneck ? {stage:bottleneck.stage,line:lineMap[bottleneck.lineId]?.name || bottleneck.lineId} : null};
    }
    return {summary,booked};
  };
  const constraints = (state,plan,schedule = null) => {
    const s = schedule || scheduleAll(state), calc = calculation(byId(state.demands,plan.demandId),byId(state.products,plan.productId));
    const materials = materialCheck(state,plan);
    const timeline = s.summary[plan.id] || null;
    const shortages = materials.filter((m) => m.short > 0.0001);
    return {materials,shortages,timeline,calc,ready:!!timeline && !timeline.failed && shortages.length===0 && !!calc && calc.netPacks>0};
  };
  const materialOverview = (state) => {
    const reserved = releasedReservations(state), draftNeeds = {};
    for(const plan of state.plans) {
      if (![`DRAFT`,`READY`,`BLOCKED`].includes(plan.status)) continue;
      const p = byId(state.products,plan.productId); if(!p) continue;
      for(const entry of p.bom) draftNeeds[entry.materialId]=(draftNeeds[entry.materialId] || 0)+entry.qty*plan.batches;
    }
    return state.materials.map((m) => {
      const usable=m.lots.filter((l)=>lotIsUsable(l,SP.todayISO())).reduce((s,l)=>s+num(l.qty),0);
      const committed=reserved[m.id] || 0, planned=draftNeeds[m.id] || 0;
      return {id:m.id,name:m.name,unit:m.unit,usable,committed,planned,short:Math.max(0,committed+planned-usable),free:Math.max(0,usable-committed),leadDays:m.leadDays};
    });
  };
  SP.engine = {num,round,byId,isoAdd,required,calculation,materialCheck,materialOverview,scheduleAll,constraints,releasedReservations};
})();
