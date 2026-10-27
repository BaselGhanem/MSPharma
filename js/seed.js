(function () {
  const SP = window.SP = window.SP || {};
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,`0`)}-${String(now.getDate()).padStart(2,`0`)}`;
  const plusDays = (n) => { const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,`0`)}-${String(d.getDate()).padStart(2,`0`)}`; };
  SP.seed = () => ({
    version: 1,
    settings: { qcLeadDays: 2, qaLeadDays: 2, defaultCleaningHours: 2 },
    lines: [
      { id: `LN-GR`, name: `Granulation Suite`, dailyHours: 16 },
      { id: `LN-BL`, name: `Blending Suite`, dailyHours: 16 },
      { id: `LN-CP`, name: `Tablet Press`, dailyHours: 16 },
      { id: `LN-EN`, name: `Encapsulation Line`, dailyHours: 16 },
      { id: `LN-CT`, name: `Coating Pan`, dailyHours: 16 },
      { id: `LN-PK`, name: `Blister & Carton`, dailyHours: 16 },
      { id: `LN-LQ`, name: `Liquid Filling`, dailyHours: 16 }
    ],
    materials: [
      { id: `MAT-API-A`, name: `Active Ingredient A`, unit: `kg`, leadDays: 21, lots: [{id:`A-2401`,qty:340,expiry:plusDays(320),status:`RELEASED`},{id:`A-2402`,qty:100,expiry:plusDays(520),status:`QUARANTINE`}] },
      { id: `MAT-EXC`, name: `Excipient Blend`, unit: `kg`, leadDays: 14, lots: [{id:`EX-2201`,qty:1000,expiry:plusDays(420),status:`RELEASED`}] },
      { id: `MAT-PVC`, name: `PVC Film`, unit: `roll`, leadDays: 20, lots: [{id:`PVC-11`,qty:80,expiry:plusDays(480),status:`RELEASED`}] },
      { id: `MAT-FOIL`, name: `Printed Foil`, unit: `roll`, leadDays: 28, lots: [{id:`FL-31`,qty:14,expiry:plusDays(480),status:`RELEASED`}] },
      { id: `MAT-LF-JO`, name: `Leaflet — Jordan`, unit: `piece`, leadDays: 14, lots: [{id:`LF-JO-1`,qty:110000,expiry:plusDays(700),status:`RELEASED`}] },
      { id: `MAT-LF-SA`, name: `Leaflet — Saudi Arabia`, unit: `piece`, leadDays: 18, lots: [{id:`LF-SA-1`,qty:18000,expiry:plusDays(700),status:`RELEASED`}] },
      { id: `MAT-BOT`, name: `Bottle & Cap`, unit: `set`, leadDays: 30, lots: [{id:`BOT-09`,qty:30000,expiry:plusDays(720),status:`RELEASED`}] }
    ],
    products: [
      { id: `PRD-TAB-A`, sku: `TAB-500-A`, name: `Product A · 500 mg Tablet`, form: `TABLET`, packSize: 20, minorUnit:`tablet`, yieldPct: 96, batchSize: 120000,
        routing: [{stage:`Granulation`,lineId:`LN-GR`,hours:4},{stage:`Blending`,lineId:`LN-BL`,hours:2},{stage:`Compression`,lineId:`LN-CP`,hours:10},{stage:`Coating`,lineId:`LN-CT`,hours:5},{stage:`Packaging`,lineId:`LN-PK`,hours:8}],
        bom:[{materialId:`MAT-API-A`,qty:48},{materialId:`MAT-EXC`,qty:24},{materialId:`MAT-PVC`,qty:3},{materialId:`MAT-FOIL`,qty:2},{materialId:`MAT-LF-JO`,qty:6000}] },
      { id: `PRD-CAP-B`, sku: `CAP-20-B`, name: `Product B · 20 mg Capsule`, form: `CAPSULE`, packSize: 14, minorUnit:`capsule`, yieldPct: 97.5, batchSize: 98000,
        routing: [{stage:`Blending`,lineId:`LN-BL`,hours:4},{stage:`Encapsulation`,lineId:`LN-EN`,hours:12},{stage:`Packaging`,lineId:`LN-PK`,hours:8}],
        bom:[{materialId:`MAT-API-A`,qty:12},{materialId:`MAT-EXC`,qty:25},{materialId:`MAT-FOIL`,qty:3},{materialId:`MAT-LF-SA`,qty:7000}] },
      { id: `PRD-LIQ-C`, sku: `LIQ-100-C`, name: `Product C · 100 ml Liquid`, form: `LIQUID`, packSize: 100, minorUnit:`ml`, yieldPct: 98, batchSize: 3000000,
        routing: [{stage:`Blending`,lineId:`LN-BL`,hours:6},{stage:`Filling`,lineId:`LN-LQ`,hours:14},{stage:`Cartoning`,lineId:`LN-PK`,hours:10}],
        bom:[{materialId:`MAT-API-A`,qty:20},{materialId:`MAT-BOT`,qty:30000},{materialId:`MAT-EXC`,qty:40}] }
    ],
    demands: [
      { id:`DEM-1001`,productId:`PRD-TAB-A`,market:`Jordan`,forecast:14000,firmOrders:11000,fgStock:1800,incoming:1000,safety:800,agentStock:6500,history:12000,dueDate:plusDays(22),priority:`HIGH`,notes:`Jordanian pack configuration`,createdAt:new Date().toISOString() },
      { id:`DEM-1002`,productId:`PRD-CAP-B`,market:`Saudi Arabia`,forecast:11000,firmOrders:12000,fgStock:1000,incoming:0,safety:1000,agentStock:2800,history:9800,dueDate:plusDays(35),priority:`NORMAL`,notes:`Saudi leaflet required`,createdAt:new Date().toISOString() },
      { id:`DEM-1003`,productId:`PRD-LIQ-C`,market:`Qatar`,forecast:48000,firmOrders:45000,fgStock:9000,incoming:3000,safety:1000,agentStock:12000,history:41000,dueDate:plusDays(42),priority:`NORMAL`,notes:`Bottle stock check`,createdAt:new Date().toISOString() },
      { id:`DEM-1004`,productId:`PRD-TAB-A`,market:`Jordan`,forecast:6500,firmOrders:5000,fgStock:1000,incoming:0,safety:500,agentStock:1100,history:5500,dueDate:plusDays(49),priority:`LOW`,notes:`Follow-up replenishment`,createdAt:new Date().toISOString() }
    ],
    plans: [],
    audit: [{id:`AUD-START`,at:new Date().toISOString(),action:`تم تجهيز بيئة بيانات تجريبية`,subject:`SupplyFlow`,details:`هذا النظام نموذج تخطيط غير موصول بـ Firebase` }]
  });
  SP.today = () => new Date().toLocaleDateString(`en-CA`);
  SP.todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,`0`)}-${String(d.getDate()).padStart(2,`0`)}`; };
})();
