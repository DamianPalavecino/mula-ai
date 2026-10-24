import test from 'node:test';
import assert from 'node:assert/strict';
import { entities, reports, entitySummary, filterReports, searchEntities, validatePerson, toCSV, demoScenarios, demoResult } from './model.mjs';

test('el alias de la demo reúne 23 reportes en cinco provincias', () => {
  const summary = entitySummary('alias-juli');
  assert.equal(summary.reports, 23);
  assert.equal(summary.provinces.length, 5);
});

test('todos los vínculos del grafo apuntan a entidades existentes', () => {
  for (const report of reports) {
    assert.ok(report.entities.length);
    assert.ok(report.entities.every(id => entities.some(e => e.id === id)));
  }
});

test('el filtro combina provincia y ventana temporal y soporta vacío', () => {
  const result = filterReports({ province: 'Santa Fe', days: 7 });
  assert.ok(result.length > 0);
  assert.ok(result.every(r => r.province === 'Santa Fe' && r.ageDays < 7));
  assert.deepEqual(filterReports({ province: 'Tierra del Fuego', days: 7 }), []);
});

test('la búsqueda consulta los seis tipos de entidad sin alterar los datos', () => {
  assert.equal(new Set(entities.map(e => e.type)).size, 6);
  assert.equal(searchEntities('  JULI.MARTINEZ  ')[0].id, 'alias-juli');
  assert.equal(searchEntities('anses-bono')[0].type, 'link');
  assert.deepEqual(searchEntities('sin-resultados'), []);
  assert.equal(searchEntities('').length, entities.length);
});

test('la configuración exige nombre y teléfono argentino normalizable', () => {
  assert.equal(validatePerson('', '3415551234').ok, false);
  assert.equal(validatePerson('Marta', '123').ok, false);
  assert.equal(validatePerson('Marta', '111111111111111111').ok, false);
  assert.deepEqual(validatePerson(' Marta ', '+54 9 341 555-1234'), { ok: true, name: 'Marta', phone: '3415551234' });
});

test('exportar respeta el filtro, comillas y líneas en el CSV', () => {
  const csv = toCSV([{ id: 1, province: 'Santa Fe', label: 'Pedido "urgente", familiar', risk: 95 }]);
  assert.equal(csv.split('\r\n').length, 2);
  assert.ok(csv.includes('"Pedido ""urgente"", familiar"'));
  assert.equal(entitySummary('inexistente'), null);
});

test('los tres guiones reflejan la demo desplegada y el normal no genera avisos', () => {
  assert.deepEqual(demoScenarios.map(s => s.id), ['familiar', 'anses', 'normal']);
  assert.equal(demoResult('familiar').risk, 94);
  assert.equal(demoResult('anses').risk, 88);
  assert.equal(demoResult('normal').risk, 4);
  assert.equal(demoResult('normal').alert, null);
  assert.equal(demoResult('normal').familyAlert, null);
  assert.ok(demoResult('familiar').alert);
  assert.ok(demoResult('familiar').familyAlert);
  assert.equal(demoResult('no-existe'), null);
});
