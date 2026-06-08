import React, { useState, useEffect, useRef } from 'react';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function Map({ mapsKey, mapsLoaded, onLocationChange }) {
  const mapContainerRef = useRef(null);
  const [cityInput, setCityInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [aqiData, setAqiData] = useState(null);
  const [nearbyList, setNearbyList] = useState([]);
  const [nearbyStatus, setNearbyStatus] = useState('');

  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapsKey || !mapsLoaded || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    // Initialize map
    const map = new window.google.maps.Map(mapContainerRef.current, {
      zoom: 13,
      center: { lat: 18.5204, lng: 73.8567 }, // Pune default
      mapTypeId: 'roadmap',
      styles: [ // Dark map style
        { elementType: 'geometry', stylers: [{ color: '#0f160f' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#5a6e5a' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#080d08' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2e1e' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a140a' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#122012' }] }
      ]
    });
    mapInstanceRef.current = map;
  }, [mapsKey, mapsLoaded]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
    };
  }, []);

  const performSearch = (service, request) => {
    return new Promise((resolve) => {
      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          resolve([]);
        }
      });
    });
  };

  const handleSearch = async () => {
    setErrorMsg('');
    const cityName = cityInput.trim();
    if (!cityName) {
      setErrorMsg('Please enter a city name.');
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityName)}&key=${mapsKey}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        const latLng = result.geometry.location;
        
        // Center Map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(latLng);
          mapInstanceRef.current.setZoom(13);
        }

        // Notify parent about location change
        const briefAddress = result.formatted_address.split(',')[0];
        onLocationChange(briefAddress);

        // Fetch features
        fetchAirQuality(latLng.lat, latLng.lng);
        fetchNearbyPlaces(latLng.lat, latLng.lng);
      } else {
        setErrorMsg('City not found. Try a different name.');
      }
    } catch (err) {
      setErrorMsg('City not found. Try a different name.');
    }
  };

  const fetchAirQuality = async (lat, lng) => {
    setAqiData(null);
    try {
      const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${mapsKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: {
            latitude: lat,
            longitude: lng
          }
        })
      });

      if (!response.ok) return;
      const data = await response.json();
      if (data.indexes && data.indexes.length > 0) {
        setAqiData(data.indexes[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNearbyPlaces = async (lat, lng) => {
    setNearbyStatus('Searching for nearby sustainable options...');
    setNearbyList([]);

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      const service = new window.google.maps.places.PlacesService(map);
      const center = new window.google.maps.LatLng(lat, lng);

      // Search 1: EV charging
      const res1 = await performSearch(service, {
        location: center,
        radius: 3000,
        keyword: 'electric vehicle charging station'
      });

      await new Promise(r => setTimeout(r, 300));

      // Search 2: Green Transit
      const res2 = await performSearch(service, {
        location: center,
        radius: 2000,
        keyword: 'bicycle rental metro station'
      });

      await new Promise(r => setTimeout(r, 300));

      // Search 3: Local Food
      const res3 = await performSearch(service, {
        location: center,
        radius: 2000,
        keyword: 'farmers market organic store'
      });

      const top1 = res1.slice(0, 3).map(r => ({ ...r, typeLabel: '⚡ EV Charging' }));
      const top2 = res2.slice(0, 3).map(r => ({ ...r, typeLabel: '🚲 Green Transit' }));
      const top3 = res3.slice(0, 3).map(r => ({ ...r, typeLabel: '🌿 Local Food' }));

      const allResults = [...top1, ...top2, ...top3];
      const uniqueResults = [];
      const seenIds = new Set();
      
      for (const item of allResults) {
        if (item.place_id && !seenIds.has(item.place_id)) {
          seenIds.add(item.place_id);
          uniqueResults.push(item);
        }
      }

      setNearbyStatus('');

      if (uniqueResults.length === 0) {
        setNearbyStatus('No sustainable options found nearby. Try a larger city.');
        return;
      }

      setNearbyList(uniqueResults);

      // Add markers to map
      uniqueResults.forEach(result => {
        const marker = new window.google.maps.Marker({
          position: result.geometry.location,
          map: map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4ade80',
            fillOpacity: 0.9,
            strokeColor: '#080d08',
            strokeWeight: 2
          },
          title: result.name
        });
        markersRef.current.push(marker);
      });

    } catch (err) {
      setNearbyStatus('Error fetching nearby places.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // If configuration is missing, render error card early
  if (!mapsKey) {
    return (
      <div className="tab-pane fade-in" style={{ display: 'block' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Maps unavailable — API key not configured</p>
        </div>
      </div>
    );
  }

  // If script hasn't loaded yet
  if (!mapsLoaded) {
    return (
      <div className="tab-pane fade-in" style={{ display: 'block' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  // Air Quality styles
  let aqiColor = 'var(--accent)';
  if (aqiData) {
    if (aqiData.aqi > 100) {
      aqiColor = 'var(--danger)';
    } else if (aqiData.aqi > 50) {
      aqiColor = 'var(--warn)';
    }
  }

  return (
    <div className="tab-pane fade-in" style={{ display: 'block' }}>
      {/* 1. HEADING CARD */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Green Map</h2>
        <p style={{ color: 'var(--text-muted)' }}>Find sustainable transport options and check your local air quality</p>
      </div>

      {/* 2. LOCATION SEARCH CARD */}
      <div className="card">
        <h3 className="card-title">Your Location</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="city-input">Enter your city</label>
          <input
            type="text"
            id="city-input"
            placeholder="e.g. Mumbai, India"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              margin: '0.5rem 0',
              outline: 'none'
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          aria-label="Search location"
          style={{
            background: 'var(--accent)',
            color: '#080d08',
            padding: '0.6rem 1.5rem',
            borderRadius: '999px',
            fontWeight: 700
          }}
        >
          Search
        </button>
        {errorMsg && (
          <p id="location-error" aria-live="polite" style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {errorMsg}
          </p>
        )}
      </div>

      {/* 3. AIR QUALITY CARD */}
      {aqiData && (
        <div className="card" id="aq-card">
          <h3 className="card-title">🌬️ Local Air Quality</h3>
          <div id="aq-content">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: aqiColor }}>
                {aqiData.aqi}
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: aqiColor }}>
                {aqiData.category}
              </span>
            </div>
            {aqiData.dominantPollutant && (
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Main pollutant: <strong>{aqiData.dominantPollutant.toUpperCase()}</strong>
              </p>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Air quality directly reflects combustion emissions in your area
            </p>
          </div>
        </div>
      )}

      {/* 4. MAP CONTAINER */}
      <div
        ref={mapContainerRef}
        id="green-map"
        style={{
          width: '100%',
          height: '400px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          marginBottom: '1.5rem'
        }}
      />

      {/* 5. NEARBY PLACES CARD */}
      <div className="card">
        <h3 className="card-title">♻️ Sustainable Options Nearby</h3>
        {nearbyStatus && <p style={{ color: 'var(--text-muted)' }}>{nearbyStatus}</p>}
        <div id="nearby-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {nearbyList.map(result => {
            const ratingVal = result.rating ? result.rating : 'N/A';
            const vicinityVal = result.vicinity || '';
            return (
              <div
                key={result.place_id}
                style={{
                  background: 'var(--surface2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  borderLeft: '3px solid var(--accent)'
                }}
              >
                <strong>{result.name}</strong><br />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{vicinityVal}</span><br />
                <span style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
                  ⭐ {ratingVal} · {result.typeLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
