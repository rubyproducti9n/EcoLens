import React, { useState, useEffect } from 'react';

export default function Calculator({ onCalculate }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    commute_km: '0',
    transport_mode: 'car-petrol',
    flights_short: '0',
    flights_long: '0',
    electricity_kwh: '0',
    heating_type: 'natural-gas',
    home_size: 'medium',
    diet_type: 'average',
    local_produce: 30,
    clothing_items: '0',
    online_orders: '0',
    electronics: '0',
  });
  
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  // Load initial values from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('carbon_form');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [id]: value };
      // Save changes immediately to localStorage
      try {
        localStorage.setItem('carbon_form', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    // Clear field-level error
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const validateAndCalculate = () => {
    const newErrors = {};
    const inputsToValidate = [
      { id: 'commute_km', label: 'Commute distance' },
      { id: 'flights_short', label: 'Short-haul flights' },
      { id: 'flights_long', label: 'Long-haul flights' },
      { id: 'electricity_kwh', label: 'Electricity bill' },
      { id: 'clothing_items', label: 'Clothing items' },
      { id: 'online_orders', label: 'Online orders' },
      { id: 'electronics', label: 'Electronics purchased' }
    ];

    let hasError = false;
    for (const input of inputsToValidate) {
      const val = String(formData[input.id]).trim();
      const num = parseFloat(val);
      if (val === '' || isNaN(num) || num < 0) {
        newErrors[input.id] = `${input.label} cannot be empty or negative.`;
        hasError = true;
      }
    }

    setErrors(newErrors);

    if (hasError) {
      setGlobalError('Please fix the highlighted fields. Values cannot be empty or negative.');
      return;
    }

    setGlobalError('');

    // Ratios & coefficients
    const commuteKm = parseFloat(formData.commute_km) || 0;
    const transportMode = formData.transport_mode;
    const flightsShort = parseFloat(formData.flights_short) || 0;
    const flightsLong = parseFloat(formData.flights_long) || 0;
    const electricityKwh = parseFloat(formData.electricity_kwh) || 0;
    const heatingType = formData.heating_type;
    const homeSize = formData.home_size;
    const dietType = formData.diet_type;
    const localProduceVal = parseFloat(formData.local_produce) || 0;
    const clothingItems = parseFloat(formData.clothing_items) || 0;
    const onlineOrders = parseFloat(formData.online_orders) || 0;
    const electronics = parseFloat(formData.electronics) || 0;

    // Transport emissions
    const transportCoefficients = {
      'car-petrol': 0.21,
      'car-diesel': 0.17,
      'car-electric': 0.05,
      'motorcycle': 0.11,
      'bus': 0.089,
      'train': 0.041,
      'bicycle': 0,
      'walk': 0
    };
    const commuteEmissions = commuteKm * 260 * (transportCoefficients[transportMode] || 0);
    const flightsShortEmissions = flightsShort * 255;
    const flightsLongEmissions = flightsLong * 1620;
    const transport = commuteEmissions + flightsShortEmissions + flightsLongEmissions;

    // Energy emissions
    const electricityEmissions = electricityKwh * 12 * 0.233;
    const heatingBase = {
      'natural-gas': 500,
      'lpg': 650,
      'oil': 700,
      'electric': 200,
      'none': 0
    };
    const homeMultipliers = {
      'studio': 0.6,
      'small': 0.8,
      'medium': 1.0,
      'large': 1.4
    };
    const heatingEmissions = (heatingBase[heatingType] || 0) * (homeMultipliers[homeSize] || 1.0);
    const energy = electricityEmissions + heatingEmissions;

    // Food emissions
    const dietBase = {
      'meat-heavy': 3300,
      'average': 2500,
      'vegetarian': 1700,
      'vegan': 1100
    };
    const rawDietVal = dietBase[dietType] || 0;
    const dietReductionFactor = 1 - (localProduceVal * 0.1 / 100);
    const food = rawDietVal * dietReductionFactor;

    // Shopping emissions
    const clothingEmissions = clothingItems * 12 * 6.3;
    const onlineEmissions = onlineOrders * 12 * 0.5;
    const electronicsEmissions = electronics * 200;
    const shopping = clothingEmissions + onlineEmissions + electronicsEmissions;

    // Total emissions
    const total_kg = transport + energy + food + shopping;

    const carbonData = {
      total_kg: parseFloat(total_kg.toFixed(2)),
      breakdown: {
        transport: parseFloat(transport.toFixed(2)),
        energy: parseFloat(energy.toFixed(2)),
        food: parseFloat(food.toFixed(2)),
        shopping: parseFloat(shopping.toFixed(2))
      }
    };

    onCalculate(carbonData);
  };

  return (
    <div className="calculator-container fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', marginBottom: '0.25rem' }}>
            Calculate Your Footprint
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Answer a few questions about your lifestyle</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${(step / 4) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Step {step} of 4
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[1, 2, 3, 4].map(s => (
                <span
                  key={s}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: s <= step ? 'var(--accent)' : 'var(--border)',
                    transition: 'background 0.2s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Steps Forms */}
        <form onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--accent2)', marginBottom: '0.25rem' }}>
                🚗 Transport
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="commute_km" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Daily commute distance (km)</label>
                <input
                  type="number"
                  id="commute_km"
                  min="0"
                  max="500"
                  value={formData.commute_km}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: `1px solid ${errors.commute_km ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                />
                {errors.commute_km && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.commute_km}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="transport_mode" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Primary transport mode</label>
                <select
                  id="transport_mode"
                  value={formData.transport_mode}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                >
                  <option value="car-petrol">car-petrol</option>
                  <option value="car-diesel">car-diesel</option>
                  <option value="car-electric">car-electric</option>
                  <option value="motorcycle">motorcycle</option>
                  <option value="bus">bus</option>
                  <option value="train">train</option>
                  <option value="bicycle">bicycle</option>
                  <option value="walk">walk</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="flights_short" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Flights per year (short-haul)</label>
                <input
                  type="number"
                  id="flights_short"
                  min="0"
                  max="50"
                  value={formData.flights_short}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: `1px solid ${errors.flights_short ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                />
                {errors.flights_short && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.flights_short}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="flights_long" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Flights per year (long-haul)</label>
                <input
                  type="number"
                  id="flights_long"
                  min="0"
                  max="20"
                  value={formData.flights_long}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: `1px solid ${errors.flights_long ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                />
                {errors.flights_long && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.flights_long}</span>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--accent2)', marginBottom: '0.25rem' }}>
                ⚡ Home Energy
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="electricity_kwh" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Monthly electricity bill (kWh)</label>
                <input
                  type="number"
                  id="electricity_kwh"
                  min="0"
                  value={formData.electricity_kwh}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: `1px solid ${errors.electricity_kwh ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                />
                {errors.electricity_kwh && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.electricity_kwh}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="heating_type" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Heating fuel</label>
                <select
                  id="heating_type"
                  value={formData.heating_type}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                >
                  <option value="natural-gas">natural-gas</option>
                  <option value="lpg">lpg</option>
                  <option value="oil">oil</option>
                  <option value="electric">electric</option>
                  <option value="none">none</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="home_size" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Home size</label>
                <select
                  id="home_size"
                  value={formData.home_size}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                >
                  <option value="studio">studio</option>
                  <option value="small">small</option>
                  <option value="medium">medium</option>
                  <option value="large">large</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--accent2)', marginBottom: '0.25rem' }}>
                🥗 Food
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="diet_type" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Diet type</label>
                <select
                  id="diet_type"
                  value={formData.diet_type}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                >
                  <option value="meat-heavy">meat-heavy</option>
                  <option value="average">average</option>
                  <option value="vegetarian">vegetarian</option>
                  <option value="vegan">vegan</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="local_produce" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Local produce %</label>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{formData.local_produce}%</span>
                </div>
                <input
                  type="range"
                  id="local_produce"
                  min="0"
                  max="100"
                  value={formData.local_produce}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    accentColor: 'var(--accent)',
                    margin: '0.5rem 0'
                  }}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--accent2)', marginBottom: '0.25rem' }}>
                🛍️ Shopping
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="clothing_items" style={{ fontSize: '0.9rem', fontWeight: 500 }}>New clothing items per month</label>
                <input
                  type="number"
                  id="clothing_items"
                  min="0"
                  max="50"
                  value={formData.clothing_items}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: `1px solid ${errors.clothing_items ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                />
                {errors.clothing_items && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.clothing_items}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="online_orders" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Online orders per month</label>
                <input
                  type="number"
                  id="online_orders"
                  min="0"
                  max="100"
                  value={formData.online_orders}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: `1px solid ${errors.online_orders ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                />
                {errors.online_orders && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.online_orders}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="electronics" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Electronics purchased per year</label>
                <input
                  type="number"
                  id="electronics"
                  min="0"
                  max="20"
                  value={formData.electronics}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--surface2)',
                    border: `1px solid ${errors.electronics ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                />
                {errors.electronics && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.electronics}</span>}
              </div>
            </div>
          )}
        </form>

        {globalError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 500, textAlign: 'center', marginTop: '1.5rem' }}>
            {globalError}
          </div>
        )}

        {/* Form navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '0.6rem 1.5rem',
              borderRadius: '999px',
              fontWeight: 700,
              visibility: step === 1 ? 'hidden' : 'visible'
            }}
          >
            Back
          </button>
          
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                background: 'var(--accent)',
                color: '#080d08',
                padding: '0.6rem 1.5rem',
                borderRadius: '999px',
                fontWeight: 700
              }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={validateAndCalculate}
              style={{
                background: 'var(--accent)',
                color: '#080d08',
                padding: '0.6rem 2rem',
                borderRadius: '999px',
                fontWeight: 800
              }}
            >
              Calculate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
