import React, { useState, useEffect } from 'react';

const tipsData = [
  { id: 1, category: "transport", title: "Switch to public transit", description: "Replace car commute 3x/week", saving_kg: 520, difficulty: "easy" },
  { id: 2, category: "transport", title: "Work from home", description: "2 days/week remote reduces commute emissions", saving_kg: 400, difficulty: "easy" },
  { id: 3, category: "transport", title: "Carpool", description: "Share rides with 1 colleague", saving_kg: 260, difficulty: "easy" },
  { id: 4, category: "energy", title: "Switch to LED bulbs", description: "Replace all incandescent bulbs", saving_kg: 80, difficulty: "easy" },
  { id: 5, category: "energy", title: "Smart thermostat", description: "Reduce heating/cooling waste by 15%", saving_kg: 150, difficulty: "medium" },
  { id: 6, category: "energy", title: "Solar panels", description: "Generate clean energy at home", saving_kg: 1200, difficulty: "hard" },
  { id: 7, category: "food", title: "Go vegetarian 3 days/week", description: "Reduce meat consumption partially", saving_kg: 400, difficulty: "easy" },
  { id: 8, category: "food", title: "Buy local produce", description: "Shop at farmers markets weekly", saving_kg: 200, difficulty: "easy" },
  { id: 9, category: "food", title: "Reduce food waste", description: "Meal plan and compost scraps", saving_kg: 300, difficulty: "medium" },
  { id: 10, category: "shopping", title: "Buy second-hand", description: "Thrift clothing instead of fast fashion", saving_kg: 350, difficulty: "easy" },
  { id: 11, category: "shopping", title: "Repair don't replace", description: "Fix electronics before buying new", saving_kg: 200, difficulty: "medium" },
  { id: 12, category: "shopping", title: "Minimalist approach", description: "Buy only what you truly need", saving_kg: 500, difficulty: "medium" }
];

const iconsMap = {
  'transport': '🚗',
  'energy': '⚡',
  'food': '🥗',
  'shopping': '🛍️'
};

export default function Tips() {
  const [filter, setFilter] = useState('all');
  const [activeTips, setActiveTips] = useState([]);

  // Safe localStorage reader
  const getLocalStorage = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return defaultValue;
  };

  useEffect(() => {
    setActiveTips(getLocalStorage('active_tips', []));
  }, []);

  const toggleTip = (tipId) => {
    let updated = getLocalStorage('active_tips', []);
    if (updated.includes(tipId)) {
      updated = updated.filter(id => id !== tipId);
    } else {
      updated.push(tipId);
    }
    try {
      localStorage.setItem('active_tips', JSON.stringify(updated));
      setActiveTips(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTips = tipsData.filter(tip => {
    if (filter === 'all') return true;
    return tip.difficulty === filter;
  });

  return (
    <div className="tab-pane fade-in" style={{ display: 'block' }}>
      {/* Header */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', marginBottom: '0.25rem' }}>
          Actionable Reduction Tips
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Choose lifestyle changes to lower your annual footprint</p>
      </div>

      {/* Filter Buttons */}
      <div className="tips-filters" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'easy', 'medium', 'hard'].map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            style={{
              padding: '0.4rem 1.25rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'capitalize',
              background: filter === level ? 'var(--accent)' : 'transparent',
              color: filter === level ? '#080d08' : 'var(--text-muted)',
              border: `1px solid ${filter === level ? 'var(--accent)' : 'var(--border)'}`,
              transition: 'all 0.2s'
            }}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Tips Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {filteredTips.map(tip => {
          const isActive = activeTips.includes(tip.id);
          const icon = iconsMap[tip.category] || '💡';
          
          return (
            <div
              key={tip.id}
              className={`tip-card ${isActive ? 'active' : ''}`}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: isActive ? '0 0 15px rgba(74, 222, 128, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', background: 'var(--surface2)', border: '1px solid var(--border)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
                  {icon}
                </span>
                <span
                  className={`difficulty-badge ${tip.difficulty}`}
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    letterSpacing: '0.05em',
                    background: tip.difficulty === 'easy' ? 'rgba(74, 222, 128, 0.1)' : tip.difficulty === 'medium' ? 'rgba(250, 204, 21, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                    color: tip.difficulty === 'easy' ? 'var(--accent)' : tip.difficulty === 'medium' ? 'var(--warn)' : 'var(--danger)',
                    border: `1px solid ${tip.difficulty === 'easy' ? 'rgba(74, 222, 128, 0.2)' : tip.difficulty === 'medium' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`
                  }}
                >
                  {tip.difficulty}
                </span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>{tip.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flexGrow: 1 }}>{tip.description}</p>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)' }}>Saves ~{tip.saving_kg} kg/yr</div>
              <button
                type="button"
                onClick={() => toggleTip(tip.id)}
                style={{
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--surface2)',
                  borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  color: isActive ? '#080d08' : 'var(--text)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                {isActive ? '✓ Doing' : 'Mark as doing'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
