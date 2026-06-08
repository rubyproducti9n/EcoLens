import React, { useState, useEffect, useRef } from 'react';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Tracker() {
  const chartRef = useRef(null);
  const [log, setLog] = useState([]);
  const [formInputs, setFormInputs] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    kg: ''
  });
  const [feedback, setFeedback] = useState({ text: '', type: 'success' });

  // Safe localStorage helper
  const getLocalStorage = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return defaultValue;
  };

  useEffect(() => {
    setLog(getLocalStorage('carbon_log', []));
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ text: '', type: 'success' });

    const month = parseInt(formInputs.month);
    const year = parseInt(formInputs.year);
    const kg = parseFloat(formInputs.kg.trim());

    if (isNaN(month) || month < 1 || month > 12 ||
        isNaN(year) || year < 2020 || year > 2030 ||
        isNaN(kg) || kg < 0 || kg > 50000) {
      setFeedback({ text: 'Error: Invalid month (1-12), year (2020-2030), or kg (0-50,000).', type: 'danger' });
      return;
    }

    let updatedLog = getLocalStorage('carbon_log', []);
    
    // Remove duplicate month+year
    updatedLog = updatedLog.filter(entry => !(entry.month === month && entry.year === year));

    // Push new entry
    updatedLog.push({
      month,
      year,
      kg,
      timestamp: Date.now()
    });

    // Sort by year then month ascending
    updatedLog.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Trim to 24 entries
    if (updatedLog.length > 24) {
      updatedLog = updatedLog.slice(-24);
    }

    try {
      localStorage.setItem('carbon_log', JSON.stringify(updatedLog));
      setLog(updatedLog);
      setFormInputs(prev => ({ ...prev, kg: '' }));
      setFeedback({ text: `✅ Logged ${kg} kg for ${monthNames[month - 1]} ${year}`, type: 'success' });
    } catch (storageErr) {
      setFeedback({ text: 'Error: Failed to save to localStorage.', type: 'danger' });
    }
  };

  // Streak calculations
  const getStreak = () => {
    if (log.length === 0) return 0;
    
    // Sort descending chronologically
    const sorted = [...log].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
    
    const now = new Date();
    const currentVal = now.getFullYear() * 12 + (now.getMonth() + 1);
    const mostRecentVal = sorted[0].year * 12 + sorted[0].month;

    if (currentVal - mostRecentVal > 1) {
      return 0; // Streak is broken
    }

    let streak = 0;
    let expectedVal = mostRecentVal;

    for (let i = 0; i < sorted.length; i++) {
      const entryVal = sorted[i].year * 12 + sorted[i].month;
      if (entryVal === expectedVal) {
        streak++;
        expectedVal--;
      } else if (entryVal > expectedVal) {
        continue; // skip duplicate
      } else {
        break;
      }
    }
    return streak;
  };

  const getVsLastPeriod = () => {
    if (log.length < 2) return { text: 'Log more entries to see trends', color: 'var(--text-muted)' };

    const previous = parseFloat(log[log.length - 2].kg) || 0;
    const current = parseFloat(log[log.length - 1].kg) || 0;

    if (previous === 0) return { text: 'N/A', color: 'var(--text-muted)' };

    const diffPct = Math.round(((current - previous) / previous) * 100);
    if (diffPct < 0) {
      return { text: `↓ ${Math.abs(diffPct)}%`, color: 'var(--accent)' };
    } else if (diffPct > 0) {
      return { text: `↑ ${diffPct}%`, color: 'var(--danger)' };
    } else {
      return { text: '0%', color: 'var(--text)' };
    }
  };

  const drawLineChart = () => {
    if (log.length < 2 || !chartRef.current || !window.google || !google.visualization) return;

    const rows = log.map(entry => {
      const xLabel = `${monthNames[entry.month - 1]} ${entry.year}`;
      const globalAvg = 400; // 4800 / 12
      return [xLabel, parseFloat(entry.kg) || 0, globalAvg];
    });

    const dt = new google.visualization.DataTable();
    dt.addColumn('string', 'Month');
    dt.addColumn('number', 'Your CO₂e (kg)');
    dt.addColumn('number', 'Global Avg');
    dt.addRows(rows);

    const options = {
      backgroundColor: 'transparent',
      colors: ['#4ade80', '#facc15'],
      legend: { textStyle: { color: '#edf5ed' } },
      hAxis: { textStyle: { color: '#5a6e5a' }, gridlines: { color: '#1e2e1e' } },
      vAxis: { textStyle: { color: '#5a6e5a' }, gridlines: { color: '#1e2e1e' } },
      chartArea: { width: '85%', height: '80%' },
      curveType: 'function',
      pointSize: 6,
      pointShape: 'circle'
    };

    const chart = new google.visualization.LineChart(chartRef.current);
    chart.draw(dt, options);
  };

  useEffect(() => {
    if (log.length < 2) return;

    let isMounted = true;
    const checkChartsReady = () => {
      if (window.google && google.visualization && google.visualization.LineChart) {
        if (isMounted) drawLineChart();
      } else {
        setTimeout(checkChartsReady, 100);
      }
    };

    checkChartsReady();

    const handleResize = () => {
      drawLineChart();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
    };
  }, [log]);

  const streak = getStreak();
  const vsLast = getVsLastPeriod();

  return (
    <div className="tab-pane fade-in" style={{ display: 'block' }}>
      {/* Heading */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', marginBottom: '0.25rem' }}>
          Monthly CO₂ Tracker
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Log your monthly footprint to track progress over time</p>
      </div>

      {/* Log Form */}
      <div className="card">
        <h3 className="card-title">Add Monthly Entry</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="month" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Month</label>
            <select
              id="month"
              value={formInputs.month}
              onChange={handleChange}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', outline: 'none' }}
            >
              {monthNames.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="year" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Year</label>
            <input
              type="number"
              id="year"
              min="2020"
              max="2030"
              value={formInputs.year}
              onChange={handleChange}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="kg" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Total CO₂e (kg)</label>
            <input
              type="number"
              id="kg"
              min="0"
              max="50000"
              placeholder="e.g. 850"
              value={formInputs.kg}
              onChange={handleChange}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: 'var(--accent)',
              color: '#080d08',
              padding: '0.6rem 1.5rem',
              borderRadius: '999px',
              fontWeight: 700,
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Log Entry
          </button>
        </form>
        <div style={{ marginTop: '0.5rem' }}><small style={{ color: 'var(--text-muted)' }}>Tip: use your Calculator result</small></div>
        {feedback.text && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 500, color: feedback.type === 'danger' ? 'var(--danger)' : 'var(--accent)' }}>
            {feedback.text}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '200px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>🔥 Streak</h4>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent2)' }}>{streak} month streak</div>
        </div>

        <div style={{ flex: 1, minWidth: '200px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>📉 vs Last Period</h4>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: vsLast.color }}>{vsLast.text}</div>
        </div>

        <div style={{ flex: 1, minWidth: '200px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>📊 Total Logged</h4>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent2)' }}>{log.length} months recorded</div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="card">
        <h3 className="card-title">Footprint Over Time</h3>
        <div ref={chartRef} style={{ width: '100%', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {log.length < 2 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>
              Add at least 2 entries to see your trend chart
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
