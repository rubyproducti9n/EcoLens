let passed = 0;
let failed = 0;
const results = [];

function assert(description, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    results.push(`  ✅ PASS: ${description}`);
  } else {
    failed++;
    results.push(`  ❌ FAIL: ${description}`);
    results.push(`     Expected: ${JSON.stringify(expected)}`);
    results.push(`     Actual:   ${JSON.stringify(actual)}`);
  }
}

function assertRange(description, actual, min, max) {
  const ok = typeof actual === 'number' && !isNaN(actual) && actual >= min && actual <= max;
  if (ok) {
    passed++;
    results.push(`  ✅ PASS: ${description} (got ${actual})`);
  } else {
    failed++;
    results.push(`  ❌ FAIL: ${description} — got ${actual}, expected ${min}–${max}`);
  }
}

function assertTruthy(description, actual) {
  if (actual) {
    passed++;
    results.push(`  ✅ PASS: ${description}`);
  } else {
    failed++;
    results.push(`  ❌ FAIL: ${description} — got falsy value`);
  }
}

// ─── PURE FUNCTIONS TO TEST ─────────────────────────────────────────

function computeTransportEmissions(commute_km, transport_mode, flights_short, flights_long) {
  const TRANSPORT_COEFF = {
    'car-petrol': 0.21,
    'car-diesel': 0.17,
    'car-electric': 0.05,
    'motorcycle': 0.11,
    'bus': 0.089,
    'train': 0.041,
    'bicycle': 0,
    'walk': 0
  };
  const commute = (Number(commute_km) || 0) * 260 * (TRANSPORT_COEFF[transport_mode] || 0);
  const shortFlights = (Number(flights_short) || 0) * 255;
  const longFlights = (Number(flights_long) || 0) * 1620;
  return Math.max(0, commute + shortFlights + longFlights);
}

function computeEnergyEmissions(electricity_kwh, heating_type, home_size) {
  const HEATING_BASE = {
    'natural-gas': 500,
    'lpg': 650,
    'oil': 700,
    'electric': 200,
    'none': 0
  };
  const HOME_MULT = {
    'studio': 0.6,
    'small': 0.8,
    'medium': 1.0,
    'large': 1.4
  };
  const elec = (Number(electricity_kwh) || 0) * 12 * 0.233;
  const heat = (HEATING_BASE[heating_type] || 0) * (HOME_MULT[home_size] || 1.0);
  return Math.max(0, elec + heat);
}

function computeFoodEmissions(diet_type, local_produce_pct) {
  const DIET_BASE = {
    'meat-heavy': 3300,
    'average': 2500,
    'vegetarian': 1700,
    'vegan': 1100
  };
  const base = DIET_BASE[diet_type] || 2500;
  const reduction = base * ((Number(local_produce_pct) || 0) / 100) * 0.1;
  return Math.max(0, base - reduction);
}

function computeShoppingEmissions(clothing_items, online_orders, electronics) {
  return Math.max(0,
    ((Number(clothing_items) || 0) * 12 * 6.3) +
    ((Number(online_orders) || 0) * 12 * 0.5) +
    ((Number(electronics) || 0) * 200)
  );
}

function computeSustainabilityScore(total_kg) {
  return Math.min(100, Math.max(0, Math.round(100 - (total_kg / 10000 * 100))));
}

function getStatusLabel(total_kg) {
  if (total_kg < 2000) return 'Low Impact';
  if (total_kg < 5000) return 'Average';
  if (total_kg < 10000) return 'High Impact';
  return 'Very High';
}

function safeParseLocalStorage(jsonString, fallback) {
  try {
    const v = JSON.parse(jsonString);
    return v !== null ? v : fallback;
  } catch (e) {
    return fallback;
  }
}

function clampValue(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

// ─── TEST CASES ───────────────────────────────────────────────────

// ─── Transport Tests ───────────────────────────────────────────
console.log('\n🚗 Transport Emissions');
assert('Zero commute bicycle = 0 transport kg',
  computeTransportEmissions(0, 'bicycle', 0, 0), 0);

assertRange('Car-petrol 20km/day, no flights is in range',
  computeTransportEmissions(20, 'car-petrol', 0, 0), 900, 1200);

assertRange('Electric car has significantly lower emissions than petrol',
  computeTransportEmissions(20, 'car-electric', 0, 0), 100, 400);

assert('Walking commute = 0 commute emissions',
  computeTransportEmissions(15, 'walk', 0, 0), 0);

assertRange('2 long-haul flights adds ~3240 kg',
  computeTransportEmissions(0, 'walk', 0, 2), 3230, 3250);

assertRange('Negative km input is clamped to 0',
  computeTransportEmissions(-10, 'car-petrol', 0, 0), 0, 0);

// ─── Energy Tests ───────────────────────────────────────────────
console.log('\n⚡ Energy Emissions');
assertRange('300 kWh/month electric + medium gas home in range',
  computeEnergyEmissions(300, 'natural-gas', 'medium'), 1100, 1500);

assertRange('No heating + 0 kWh = 0',
  computeEnergyEmissions(0, 'none', 'medium'), 0, 0);

assertRange('Large home uses more than studio same heating',
  computeEnergyEmissions(200, 'natural-gas', 'large'),
  computeEnergyEmissions(200, 'natural-gas', 'studio') + 1,
  99999);

// ─── Food Tests ─────────────────────────────────────────────────
console.log('\n🥗 Food Emissions');
assertRange('Vegan diet is less than meat-heavy',
  computeFoodEmissions('vegan', 0),
  0, computeFoodEmissions('meat-heavy', 0) - 1);

assertRange('100% local produce reduces food emissions slightly',
  computeFoodEmissions('average', 100),
  0, computeFoodEmissions('average', 0) - 1);

assertRange('Meat-heavy diet at 0% local is ~3300 kg',
  computeFoodEmissions('meat-heavy', 0), 3290, 3310);

// ─── Shopping Tests ─────────────────────────────────────────────
console.log('\n🛍️ Shopping Emissions');
assert('Zero shopping = 0 kg', computeShoppingEmissions(0, 0, 0), 0);

assertRange('10 clothing/mo + 20 orders/mo + 2 electronics',
  computeShoppingEmissions(10, 20, 2), 1000, 2200);

// ─── Sustainability Score Tests ──────────────────────────────────
console.log('\n📊 Sustainability Score');
assert('0 kg = score 100', computeSustainabilityScore(0), 100);
assert('10000 kg = score 0', computeSustainabilityScore(10000), 0);
assert('5000 kg = score 50', computeSustainabilityScore(5000), 50);
assert('Negative kg clamped to score 100', computeSustainabilityScore(-500), 100);
assert('20000 kg clamped to score 0', computeSustainabilityScore(20000), 0);

// ─── Status Label Tests ──────────────────────────────────────────
console.log('\n🏷️ Status Labels');
assert('1999 kg = Low Impact', getStatusLabel(1999), 'Low Impact');
assert('2000 kg = Average', getStatusLabel(2000), 'Average');
assert('4999 kg = Average', getStatusLabel(4999), 'Average');
assert('5000 kg = High Impact', getStatusLabel(5000), 'High Impact');
assert('10000 kg = Very High', getStatusLabel(10000), 'Very High');

// ─── Safe Parse Tests ────────────────────────────────────────────
console.log('\n💾 Safe LocalStorage Parse');
assert('Valid JSON returns parsed object',
  safeParseLocalStorage('{"kg":500}', null), { kg: 500 });
assert('Invalid JSON returns fallback',
  safeParseLocalStorage('not-json{{{', null), null);
assert('Null string returns fallback',
  safeParseLocalStorage('null', []), []);
assert('Empty string returns fallback',
  safeParseLocalStorage('', {}), {});

// ─── Clamp Tests ─────────────────────────────────────────────────
console.log('\n🔒 Value Clamping');
assert('Clamp within range returns value', clampValue(50, 0, 100), 50);
assert('Clamp below min returns min', clampValue(-5, 0, 100), 0);
assert('Clamp above max returns max', clampValue(200, 0, 100), 100);
assert('Clamp NaN returns min', clampValue(NaN, 0, 100), 0);
assert('Clamp string number works', clampValue('75', 0, 100), 75);

// ─── RESULTS SUMMARY ─────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
results.forEach(r => console.log(r));
console.log('─'.repeat(50));
console.log(`\nTotal: ${passed + failed} tests | ✅ ${passed} passed | ❌ ${failed} failed`);
if (failed > 0) {
  console.error(`\n⚠️  ${failed} test(s) failed — fix before submitting`);
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}
