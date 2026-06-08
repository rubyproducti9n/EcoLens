import React, { useEffect, useRef } from 'react';

export default function Insights({ carbonData, onNavigateToCalculator }) {
  const chartRef = useRef(null);

  // Load calculations helper
  const getLocalStorage = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return defaultValue;
  };

  const data = carbonData || getLocalStorage('carbon_data', null);
  const formData = getLocalStorage('carbon_form', {});

  // Generate insights list
  const generateInsightsList = () => {
    if (!data) return [];
    const total_kg = data.total_kg;
    const breakdown = data.breakdown || {};
    const transport = breakdown.transport || 0;

    const diffPercent = Math.round(((total_kg - 4800) / 4800) * 100);
    const diffText = diffPercent > 0 ? `${diffPercent}% above` : diffPercent < 0 ? `${Math.abs(diffPercent)}% below` : 'equal to';

    const list = [
      `🌍 Your footprint is ${diffText} the global average of 4,800 kg CO₂e`
    ];

    if (total_kg > 0 && (transport / total_kg) > 0.40) {
      list.push("🚗 Transport is your biggest driver — public transit or EV could cut this by up to 60%");
    }
    if (formData.diet_type === 'meat-heavy') {
      list.push("🥗 Switching to a vegetarian diet saves ~800 kg CO₂e/year");
    }
    if (parseFloat(formData.electricity_kwh) > 400) {
      list.push("⚡ Your energy use is above average — LEDs + smart thermostat can cut 20%");
    }
    if (parseFloat(formData.clothing_items) > 5) {
      list.push("🛍️ Fast fashion adds up — buying secondhand monthly saves ~350 kg CO₂e/year");
    }
    if (parseFloat(formData.flights_long) > 2) {
      list.push("✈️ Reducing 1 long-haul flight saves ~1,620 kg CO₂e");
    }

    return list;
  };

  const drawDonutChart = () => {
    if (!data || !chartRef.current || !window.google || !google.visualization) return;

    const transport_kg = parseFloat(data.breakdown.transport) || 0;
    const energy_kg = parseFloat(data.breakdown.energy) || 0;
    const food_kg = parseFloat(data.breakdown.food) || 0;
    const shopping_kg = parseFloat(data.breakdown.shopping) || 0;

    const dt = google.visualization.arrayToDataTable([
      ['Category', 'kg CO₂e'],
      ['🚗 Transport', transport_kg],
      ['⚡ Energy', energy_kg],
      ['🥗 Food', food_kg],
      ['🛍️ Shopping', shopping_kg]
    ]);

    const options = {
      pieHole: 0.5,
      backgroundColor: 'transparent',
      colors: ['#4ade80', '#facc15', '#fb923c', '#60a5fa'],
      legend: { textStyle: { color: '#edf5ed' } },
      pieSliceTextStyle: { color: '#080d08' },
      chartArea: { width: '90%', height: '85%' },
      tooltip: { text: 'both' }
    };

    const chart = new google.visualization.PieChart(chartRef.current);
    chart.draw(dt, options);
  };

  useEffect(() => {
    if (!data) return;

    let isMounted = true;
    const checkChartsReady = () => {
      if (window.google && google.visualization && google.visualization.PieChart) {
        if (isMounted) drawDonutChart();
      } else {
        setTimeout(checkChartsReady, 100);
      }
    };

    checkChartsReady();

    // Redraw on window resize
    const handleResize = () => {
      drawDonutChart();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  if (!data) {
    return (
      <div className="tab-pane fade-in" style={{ display: 'block' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No data yet — complete the Calculator first</p>
          <button
            onClick={onNavigateToCalculator}
            style={{
              background: 'var(--accent)',
              color: '#080d08',
              padding: '0.6rem 1.5rem',
              borderRadius: '999px',
              fontWeight: 700
            }}
          >
            Go to Calculator
          </button>
        </div>
      </div>
    );
  }

  const { total_kg } = data;
  const diffPercent = Math.round(((total_kg - 4800) / 4800) * 100);
  const diffText = diffPercent > 0 ? `${diffPercent}% above` : diffPercent < 0 ? `${Math.abs(diffPercent)}% below` : 'equal to';

  let statusLabel = "";
  let statusColor = "";
  if (total_kg < 2000) {
    statusLabel = "🟢 Low Impact";
    statusColor = "var(--accent)";
  } else if (total_kg < 5000) {
    statusLabel = "🟡 Average";
    statusColor = "var(--warn)";
  } else if (total_kg < 10000) {
    statusLabel = "🟠 High Impact";
    statusColor = "var(--orange)";
  } else {
    statusLabel = "🔴 Very High";
    statusColor = "var(--danger)";
  }

  const score = Math.max(0, Math.round(100 - (total_kg / 10000 * 100)));
  const dasharray = 251.2;
  const dashoffset = dasharray - (score / 100 * dasharray);
  const insights = generateInsightsList();

  return (
    <div className="tab-pane fade-in" style={{ display: 'block' }}>
      {/* HERO SCORE CARD */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: 'var(--accent)' }}>
            {total_kg.toLocaleString()} kg
          </h1>
          <p>CO₂e per year</p>
          <span style={{ background: statusColor, color: '#080d08', padding: '0.35rem 0.75rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.85rem', display: 'inline-block', margin: '0.75rem 0' }}>
            {statusLabel}
          </span>
          <p style={{ color: 'var(--text-muted)' }}>Global average: 4,800 kg · You are {diffText}</p>
        </div>
        <div>
          <svg width="100" height="100" role="img" aria-label={`Sustainability score ${score} out of 100`}>
            <title>Sustainability Score</title>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" stroke-width="8" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--accent)"
              stroke-width="8"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
            <text x="50" y="55" textAnchor="middle" fill="var(--text)" fontFamily="var(--font-display)" fontSize="20" fontWeight="800">
              {score}
            </text>
          </svg>
        </div>
      </div>

      {/* BREAKDOWN DONUT CHART */}
      <div className="card">
        <h3 className="card-title">Emissions Breakdown</h3>
        <div ref={chartRef} style={{ width: '100%', height: '320px' }}></div>
      </div>

      {/* PERSONALIZED INSIGHTS LIST */}
      <div className="card">
        <h3 className="card-title">Your Insights</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {insights.map((ins, idx) => (
            <li key={idx} style={{ borderLeft: '3px solid var(--accent)', padding: '0.75rem 1rem', background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)' }}>
              {ins}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
