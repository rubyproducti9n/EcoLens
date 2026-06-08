import React, { useState, useEffect } from 'react';
import Calculator from './components/Calculator';
import Insights from './components/Insights';
import Tracker from './components/Tracker';
import Tips from './components/Tips';
import Map from './components/Map';

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [carbonData, setCarbonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapsKey, setMapsKey] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [locationText, setLocationText] = useState('');

  // Initial setup: load config and fetch key
  useEffect(() => {
    // Read carbonData from localStorage
    try {
      const saved = localStorage.getItem('carbon_data');
      if (saved) {
        setCarbonData(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }

    async function loadConfig() {
      let key = '';
      try {
        // 1. Compatibility check: check environment variables first (easy for npm run dev)
        // Vite env variables are loaded from import.meta.env
        if (import.meta.env.VITE_MAPS_KEY) {
          key = import.meta.env.VITE_MAPS_KEY;
        } else {
          // 2. Compatibility check: fetch from /config endpoint (easy for Docker/Nginx setup)
          const res = await fetch('/config');
          if (res.ok) {
            const cfg = await res.json();
            key = cfg.MAPS_KEY;
          }
        }
      } catch (err) {
        console.warn('Config fetch failed, running without Maps/AQ features.');
      }

      setMapsKey(key);

      if (key) {
        // Define global onMapsReady
        window.onMapsReady = () => {
          setMapsLoaded(true);
        };

        // Create script tag
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=onMapsReady`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      } else {
        setMapsLoaded(false);
      }

      // Load Google Charts
      if (window.google) {
        window.google.charts.load('current', { packages: ['corechart', 'bar'] });
        window.google.charts.setOnLoadCallback(() => {
          window.chartsReady = true;
        });
      }

      setLoading(false);
    }

    loadConfig();
  }, []);

  const handleCalculate = (data) => {
    setCarbonData(data);
    try {
      localStorage.setItem('carbon_data', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
    setActiveTab('insights');
  };

  if (loading) {
    return (
      <div id="loading-overlay">
        <div className="spinner"></div>
        <p>Initialising EcoLens...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* HEADER */}
      <header id="app-header">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('calculator')}>
          🌿 EcoLens
          <span className="logo-tagline">Carbon Intelligence</span>
        </div>
        {locationText && (
          <span id="location-badge" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
            📍 {locationText}
          </span>
        )}
      </header>

      {/* NAVIGATION */}
      <nav id="tab-nav" aria-label="Main navigation">
        <button data-tab="calculator" className={activeTab === 'calculator' ? 'active' : ''} onClick={() => setActiveTab('calculator')}>
          🧮 Calculator
        </button>
        <button data-tab="insights" className={activeTab === 'insights' ? 'active' : ''} onClick={() => setActiveTab('insights')}>
          📊 Insights
        </button>
        <button data-tab="tracker" className={activeTab === 'tracker' ? 'active' : ''} onClick={() => setActiveTab('tracker')}>
          📈 Tracker
        </button>
        <button data-tab="tips" className={activeTab === 'tips' ? 'active' : ''} onClick={() => setActiveTab('tips')}>
          💡 Tips
        </button>
        <button data-tab="map" className={activeTab === 'map' ? 'active' : ''} onClick={() => setActiveTab('map')}>
          🗺️ Map
        </button>
      </nav>

      {/* ACTIVE TAB CONTENT */}
      <main id="app-main" style={{ flexGrow: 1 }}>
        {activeTab === 'calculator' && <Calculator onCalculate={handleCalculate} />}
        {activeTab === 'insights' && <Insights carbonData={carbonData} onNavigateToCalculator={() => setActiveTab('calculator')} />}
        {activeTab === 'tracker' && <Tracker />}
        {activeTab === 'tips' && <Tips />}
        {activeTab === 'map' && <Map mapsKey={mapsKey} mapsLoaded={mapsLoaded} onLocationChange={setLocationText} />}
      </main>

      {/* FOOTER */}
      <footer>Built for PromptWar · EcoLens · Carbon awareness starts with you</footer>
    </div>
  );
}
