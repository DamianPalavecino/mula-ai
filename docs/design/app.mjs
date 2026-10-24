import { landingView, familyView, adminView } from './screens.mjs';
import { entities, reports, entitySummary, filterReports, searchEntities, validatePerson, toCSV } from './model.mjs';

const paths = {
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  file: '<path d="M5 2h9l5 5v15H5V2Zm9 0v6h5M8 12h8m-8 4h6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.2"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a6 6 0 0 1 3 5v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bell: '<path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4l-2 3Zm5 4h4"/>',
  link: '<path d="m9 15 6-6m-7 4-2 2a4 4 0 0 0 6 6l3-3m-4-12 2-2a4 4 0 0 1 6 6l-3 3"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.shield}</svg>`;
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const logo = () => `<a class="wordmark" href="#inicio" aria-label="Mula, inicio">mula<span class="brand-mark">${icon('shield')}</span></a>`;
const types = { alias:'Alias', telefono:'Teléfono', cvu:'CVU', cbu:'CBU', cuit:'CUIT', link:'Sitio web' };
let person = { name:'Marta', phone:'3415551234' };
let reviewed = false;
let toastTimer;
const app = document.querySelector('#app');
function locationState() {
  const [route, query = ''] = location.hash.slice(1).split('?');
  return { route: ['familia','admin'].includes(route) ? route : 'inicio', params: new URLSearchParams(query) };
}
function setParam(key, value) {
  const { route, params } = locationState();
  if (value) params.set(key, value); else params.delete(key);
  location.hash = route + (params.size ? '?' + params.toString() : '');
}
function notify(text) {
  const toast = document.querySelector('#toast');
  toast.textContent = text; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 5000);
}
function sampleNote() { return '<p class="sample-note">Prototipo de diseño. Datos ilustrativos, sin conexión a cuentas reales.</p>'; }
function header(route) {
  return `<header class="site-header container">${logo()}<nav aria-label="Navegación principal">${route === 'inicio' ? '<a href="#como-funciona" data-scroll="como-funciona">Cómo te cuida</a><a href="#preguntas" data-scroll="preguntas">Preguntas</a>' : `<a href="#familia" ${route==='familia'?'aria-current="page"':''}>Mi familia</a><a href="#admin" ${route==='admin'?'aria-current="page"':''}>La red</a>`}</nav>${route==='inicio'?'<a href="#familia" class="header-action">Entrar a mi cuenta</a>':`<div class="account"><span>${route==='admin'?'Equipo de análisis':'Lucía Fernández'}</span><span class="avatar small">${route==='admin'?'EA':'LF'}</span></div>`}</header>`;
}
function landing() { return landingView({ icon, logo, params: locationState().params }); }
function family() { return familyView({ icon, logo, params: locationState().params, person, reviewed, confidencePage }); }
function confidencePage() {
  return `<section class="confidence-page"><h2>Las personas que ${esc(person.name)} conoce.</h2><p>En este ejemplo, los mensajes de estos contactos no se analizan.</p><div class="contact"><span class="avatar">LF</span><div><strong>Lucía Fernández</strong><span>Familiar que recibe alertas</span></div>${icon('check')}</div><div class="contact"><span class="avatar alternate">JP</span><div><strong>Juli Pérez</strong><span>Contacto de confianza</span></div>${icon('check')}</div><button class="btn quiet" type="button" data-action="setup">Editar protección</button></section>`;
}
function graph(source, selected) {
  const visible = entities.filter(e => source.some(r => r.entities.includes(e.id)));
  const points = source.map((r,i) => { const angle = i * 2.39996; const radius = 125 + i % 5 * 27; return { ...r, x:425+Math.cos(angle)*radius*1.48, y:260+Math.sin(angle)*radius }; });
  return `<svg class="network-graph" viewBox="0 0 850 510" role="img" aria-label="Red ilustrativa de cuentas y reportes. Seleccioná una entidad en el gráfico o en la lista inferior."><defs><pattern id="graph-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" class="grid-dot"/></pattern></defs><rect width="850" height="510" fill="url(#graph-grid)"/>${points.flatMap(r => r.entities.map(id=>{ const e=entities.find(e=>e.id===id); return `<line x1="${r.x}" y1="${r.y}" x2="${e.x}" y2="${e.y}" class="edge ${id===selected?'selected-edge':''}"/>`; })).join('')}${points.map(r=>`<circle cx="${r.x}" cy="${r.y}" r="4" class="report-node"/>`).join('')}${visible.map(e=>`<g class="graph-entity ${selected===e.id?'selected-node':''}" data-entity="${e.id}" tabindex="0" role="button" aria-label="Seleccionar ${e.value}" transform="translate(${e.x} ${e.y})"><circle class="node-halo" r="${selected===e.id?35:25}"/><circle class="entity-node ${e.type}" r="${selected===e.id?18:11}"/><text y="${selected===e.id?49:34}" text-anchor="middle">${esc(e.type==='cbu'||e.type==='cvu'?types[e.type]+' …'+e.value.slice(-4):e.value)}</text></g>`).join('')}</svg>`;
}
function admin() { return adminView({ icon, logo, params: locationState().params, graph, reportTable, territory }); }
function reportTable(source) {
  return `<section class="report-section"><h2>Reportes de la muestra</h2><table><thead><tr><th>Reporte</th><th>Modalidad</th><th>Provincia</th><th>Riesgo</th></tr></thead><tbody>${source.map(r=>`<tr><td><span class="cell-label">Reporte</span>#${r.id}</td><td><span class="cell-label">Modalidad</span>${r.label}</td><td><span class="cell-label">Provincia</span>${r.province}</td><td><span class="cell-label">Riesgo</span><span class="tag danger">${r.risk}/100</span></td></tr>`).join('')||'<tr><td colspan="4">Sin reportes con estos filtros.</td></tr>'}</tbody></table></section>`;
}
function territory(source) {
  const counts=[...new Set(reports.map(r=>r.province))].map(p=>({p,n:source.filter(r=>r.province===p).length}));
  return `<section class="territory-section"><h2>Dónde aparecen los reportes.</h2><div class="territory-chart">${counts.map(({p,n})=>`<div><span>${p}</span><meter min="0" max="${Math.max(1,...counts.map(c=>c.n))}" value="${n}" aria-label="${p}: ${n} reportes">${n}</meter><strong>${n}</strong></div>`).join('')}</div></section>`;
}
function panel(title, body) {
  const target=document.querySelector('#inline-panel');
  target.innerHTML=`<section class="inline-panel"><div class="section-heading"><h2>${title}</h2><button type="button" class="icon-button" data-action="close" aria-label="Cerrar detalle">${icon('close')}</button></div>${body}</section>`;
  target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
  target.querySelector('input, button')?.focus({preventScroll:true});
}
function render() {
  const {route}=locationState();
  app.innerHTML=route==='familia'?family():route==='admin'?admin():landing();
  document.body.dataset.route=route;
  document.title=`${route==='inicio'?'Una red que te cuida':route==='familia'?'Tu familia':'Mapa de conexiones'} | Mula`;
  document.querySelectorAll('[data-screen]').forEach(a=>{ if(a.dataset.screen===route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current'); });
  document.querySelectorAll('.workspace-tabs a').forEach(a=>{ const link=new URL(a.href); if(link.hash===location.hash || (link.hash==='#'+route && !locationState().params.has('tab'))) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
}
document.addEventListener('click', e=>{
  const scroll=e.target.closest('[data-scroll]');
  if(scroll){e.preventDefault();document.getElementById(scroll.dataset.scroll)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
  const scenario=e.target.closest('[data-scenario]'); if(scenario){setParam('guion',scenario.dataset.scenario);return;}
  const entity=e.target.closest('[data-entity]'); if(entity){setParam('entidad',entity.dataset.entity);return;}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action==='case-example') { document.querySelector('#case-example').innerHTML='<div class="case-result"><span class="tag danger">Ejemplo precalculado</span><h3>Pedido de $180.000 al alias juli.martinez.mp</h3><p>En la app actual, este paso extrae los datos de las capturas y prepara la denuncia y el pedido de bloqueo.</p><a class="text-button" href="#familia?tab=verificar">Consultar la cuenta</a></div>'; }
  if(action==='setup') panel('A quién querés cuidar.',`<form id="person-form" data-endpoint=""><p>Estos cambios se guardan solo en esta vista de demostración.</p><div class="setup-fields"><label>Nombre<input name="nombre" value="${esc(person.name)}" autocomplete="given-name" maxlength="60" required></label><label>WhatsApp<input name="telefono" value="${esc(person.phone)}" autocomplete="tel" inputmode="tel" required></label></div><p id="form-help" class="form-help" aria-live="polite"></p><button class="btn" type="submit">Aplicar en la demo</button></form>`);
  if(action==='close')document.querySelector('#inline-panel').innerHTML='';
  if(action==='contacts')setParam('tab','confianza');
  if(action==='alert')panel('Una pausa antes de transferir.',`<div class="alert-detail-grid"><div><span class="tag danger">Riesgo 94/100</span><h3>Mensaje recibido por ${esc(person.name)}</h3><blockquote>“Hola abu, soy Juli. Cambié de número. Mandame $180.000 a juli.martinez.mp.”</blockquote><p>Señales: número desconocido, suplantación de familiar y pedido de transferencia.</p></div><div><h3>El próximo paso es una llamada.</h3><p>Contactá a Juli al número que ya tenés agendado y confirmá si realmente necesita ayuda.</p><button type="button" class="btn" data-action="review" ${reviewed?'disabled':''}>${reviewed?'Alerta revisada':'Marcar como revisada en la demo'}</button></div></div>`);
  if(action==='review'){reviewed=true;render();}
  if(action==='report-help')panel('Ordená tu caso.',`<ol class="help-steps"><li>Guardá capturas de la conversación y del comprobante.</li><li>Reuní alias, cuentas, teléfonos y monto transferido.</li><li>En la aplicación, podés preparar una denuncia y un pedido de bloqueo.</li></ol><p>Esta vista de diseño no recibe archivos ni envía denuncias.</p><a class="text-button" href="#admin">Ver cómo se conectan los reportes ${icon('arrow')}</a>`);
  if(action==='entity-reports'){
    const {params}=locationState();const summary=entitySummary(params.get('entidad')||'alias-juli',filterReports({province:params.get('provincia')||'',days:Number(params.get('dias')||90)}));
    panel(`Reportes de ${esc(summary.value)}`,reportTable(summary.matches));
  }
  if(action==='export'){
    const {params}=locationState();const data=filterReports({province:params.get('provincia')||'',days:Number(params.get('dias')||90)});
    const url=URL.createObjectURL(new Blob(['\uFEFF'+toCSV(data)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='mula-reportes-demo.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Se descargó la muestra filtrada de reportes sintéticos.');
  }
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.graph-entity')){e.preventDefault();setParam('entidad',e.target.dataset.entity);}if(e.key==='Escape'){const panel=document.querySelector('#inline-panel');if(panel)panel.innerHTML='';}});
document.addEventListener('change',e=>{if(e.target.id==='province-filter')setParam('provincia',e.target.value);if(e.target.id==='days-filter')setParam('dias',e.target.value);});
document.addEventListener('input',e=>{if(e.target.id!=='entity-search')return;const q=e.target.value.trim();document.querySelector('#search-results').innerHTML=q?searchEntities(q).map(ent=>`<button type="button" data-entity="${ent.id}"><span>${types[ent.type]}</span>${esc(ent.value)}${icon('chevron')}</button>`).join('')||'<p>No encontramos esa entidad en la muestra.</p>':'';});
document.addEventListener('submit',e=>{
  if(e.target.id==='verify-form'){e.preventDefault();const q=new FormData(e.target).get('cuenta').trim();const match=searchEntities(q)[0];document.querySelector('#verify-result').innerHTML=match?`<p class="verification-result"><strong>${entitySummary(match.id).reports} reportes en esta muestra.</strong> Frená y verificá antes de transferir.</p>`:'<p class="verification-result neutral">Sin coincidencias en la muestra. Eso no garantiza que la cuenta sea segura.</p>';}
  if(e.target.id==='person-form'){e.preventDefault();const f=new FormData(e.target);const result=validatePerson(f.get('nombre'),f.get('telefono'));if(!result.ok){document.querySelector('#form-help').textContent=result.error;return;}person=result;render();}
});
let lastRoute=locationState().route;
window.addEventListener('hashchange',()=>{const route=locationState().route;render();if(route!==lastRoute)window.scrollTo({top:0,behavior:'instant'});lastRoute=route;});
render();
