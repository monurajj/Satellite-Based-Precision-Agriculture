/**
 * Location search + weather auto-fill for farmers
 * Uses Open-Meteo (geocoding + weather) via backend proxy
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { searchLocations, fetchWeather } from '../api/predictions';

const inputClass =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-farm-green focus:border-farm-green transition-all duration-200';

export default function LocationWeather({ onWeatherFetched }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { results: r } = await searchLocations(q);
      setResults(r || []);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
  }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSelectLocation(loc) {
    setSelected(loc);
    setShowDropdown(false);
    setQuery(loc.label);
    setWeatherLoading(true);
    try {
      const weather = await fetchWeather(loc.latitude, loc.longitude);
      onWeatherFetched(weather);
    } catch (err) {
      onWeatherFetched(null);
    } finally {
      setWeatherLoading(false);
    }
  }

  async function handleUseMyLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Location access not supported by your browser.');
      return;
    }
    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const weather = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
          const label = weather?.locationName || `Your location (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`;
          setSelected({
            label,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setQuery(label);
          onWeatherFetched(weather);
        } catch {
          setGeoError('Could not fetch weather for your location.');
        } finally {
          setWeatherLoading(false);
        }
      },
      (err) => {
        setGeoError(err.message === 'User denied Geolocation' ? 'Location access was denied.' : 'Could not get location.');
        setWeatherLoading(false);
      }
    );
  }

  return (
    <div ref={wrapperRef} className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <span>📍</span> Your field location
      </label>
      <p className="text-sm text-farm-muted mb-2">
        Search your city or village to auto-fill weather (temp, rainfall, sun). Or use your GPS.
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="e.g. Delhi, Punjab, Nashik..."
            className={inputClass}
            disabled={weatherLoading}
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-farm-muted">Searching...</span>
          )}
          {showDropdown && results.length > 0 && (
            <ul className="absolute z-20 w-full mt-1 bg-white border-2 border-green-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {results.map((loc) => (
                <li key={loc.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full text-left px-4 py-3 hover:bg-farm-light transition flex items-center gap-2"
                  >
                    <span className="text-lg">📍</span>
                    <span className="font-medium">{loc.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={weatherLoading}
          className="px-4 py-3 bg-white border-2 border-farm-green text-farm-green font-semibold rounded-xl hover:bg-farm-light transition shrink-0 flex items-center gap-2"
          title="Use GPS location"
        >
          <span>🧭</span>
          <span className="hidden sm:inline">Use GPS</span>
        </button>
      </div>
      {weatherLoading && (
        <p className="text-sm text-farm-muted animate-pulse">Fetching weather data...</p>
      )}
      {selected && !weatherLoading && (
        <p className="text-sm text-farm-green font-medium flex items-center gap-2">
          <span>✓</span> Weather loaded for {selected.label}
        </p>
      )}
      {geoError && (
        <p className="text-sm text-amber-700">{geoError}</p>
      )}
    </div>
  );
}
