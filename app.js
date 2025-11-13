// Mini Health + GPS + KROKY
// © 2025 - Demo prehliadačová verzia
// Funguje cez Geolocation API + výpočet krokov podľa dĺžky kroku

document.addEventListener('DOMContentLoaded', () => {

  // DOM prvky
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const saveBtn = document.getElementById('saveBtn');
  const gpsStatus = document.getElementById('gpsStatus');
  const distanceEl = document.getElementById('distance');
  const timeEl = document.getElementById('time');
  const speedEl = document.getElementById('speed');
  const pointsEl = document.getElementById('points');
  const stepsInput = document.getElementById('stepsInput');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const historyEl = document.getElementById('history');
  const hrInput = document.getElementById('hrInput');
  const saveSnapshotBtn = document.getElementById('saveSnapshot');
  const lastSnapshot = document.getElementById('lastSnapshot');
  const activityType = document.getElementById('activityType');

  // stav
  let watchId = null;
  let tracking = false;
  let points = [];
  let startTime = null;
  let timerInterval = null;
  let totalSteps = 0;
  const stepLength = 0.75; // priemerná dĺžka kroku v metroch

  // pomocné funkcie
  const toRad = (deg) => deg * Math.PI / 180;

  function haversine(a, b) {
    const R = 6371000; // Zem polomer v metroch
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const A = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
    return R * C;
  }

  function totalDistanceMeters(pts) {
    if (pts.length < 2) return 0;
    return pts.slice(1).reduce((acc, p, i) => acc + haversine(pts[i], p), 0);
  }

  function formatTime(ms) {
    const s = Math.floor(ms/1000);
    const h = String(Math.floor(s/3600)).padStart(2,'0');
    const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
    const sec = String(s%60).padStart(2,'0');
    return ${h}:${m}:${sec};
  }

  function refreshUI() {
    const dist = totalDistanceMeters(points);
    const elapsed = startTime ? Date.now() - startTime : 0;
    const km = dist / 1000;
    const kmh = km / (elapsed / 3600000);
    const steps = Math.round(dist / stepLength);

    distanceEl.textContent = km.toFixed(2) + ' km';
    timeEl.textContent = formatTime(elapsed);
    speedEl.textContent = (kmh || 0).toFixed(1) + ' km/h';
    stepsInput.value = steps;
    totalSteps = steps;

    pointsEl.textContent = points.length
      ? points.map(p => ${p.lat.toFixed(5)}, ${p.lon.toFixed(5)} (${p.accuracy}m)).join('\n')
      : 'Žiadne GPS body';

    downloadBtn.disabled = points.length === 0;
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(refreshUI, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function startTracking() {
    if (!navigator.geolocation) {
      gpsStatus.textContent = 'GPS nie je podporované.';
      return;
    }

    points = [];
    startTime = Date.now();
    tracking = true;
    totalSteps = 0;

    watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000
    });

    startBtn.disabled = true;
    stopBtn.disabled = false;
    saveBtn.disabled = true;
    gpsStatus.textContent = 'Sledovanie spustené...';
    startTimer();
  }

  function stopTracking() {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    tracking = false;
    stopTimer();

    startBtn.disabled = false;
    stopBtn.disabled = true;
    saveBtn.disabled = points.length === 0;
    gpsStatus.textContent = 'Sledovanie zastavené.';
  }

  function onPosition(pos) {
    const c = pos.coords;
    points.push({
      lat: c.latitude,
      lon: c.longitude,
      accuracy: Math.round(c.accuracy),
      time: new Date(pos.timestamp).toISOString()
    });
    refreshUI();
  }

  function onError(err) {
    gpsStatus.textContent = 'Chyba GPS: ' + err.message;
  }

  function saveActivity() {
    const dist = totalDistanceMeters(points);
    const elapsed = Date.now() - startTime;
    const record = {
      id: Date.now(),
      type: activityType.value,
      start: new Date(startTime).toISOString(),
      duration_ms: elapsed,
      distance_m: Math.round(dist),
      steps: totalSteps,
      avg_speed_kmh: ((dist/1000) / (elapsed / 3600000)).toFixed(1),
      points
    };

    const history = JSON.parse(localStorage.getItem('health_history') || '[]');
    history.unshift(record);
    localStorage.setItem('health_history', JSON.stringify(history));
    renderHistory();
    alert('Aktivita uložená!');
  }

  function renderHistory() {
    const hist = JSON.parse(localStorage.getItem('health_history') || '[]');
    historyEl.innerHTML = hist.length
      ? hist.map(h => `<li>
          <div>
            <strong>${h.type}</strong> • ${(h.distance_m/1000).toFixed(2)} km • ${h.steps} krokov
          </div>
          <small>${new Date(h.start).toLocaleString()}</small>
        </li>`).join('')
      : '<li>Žiadne uložené aktivity</li>';
  }

  function saveSnapshot() {
    const hr = Number(hrInput.value) || 0;
    const steps = Number(stepsInput.value) || 0;
    const snap = { ts: new Date().toISOString(), hr, steps };
    const snaps = JSON.parse(localStorage.getItem('health_snaps') || '[]');
    snaps.unshift(snap);
    localStorage.setItem('health_snaps', JSON.stringify(snaps));
    lastSnapshot.textContent = Pulz ${hr} bpm • ${steps} krokov (${snap.ts});
  }

  function clearData() {
    if (confirm('Vymazať všetky údaje?')) {
      localStorage.clear();
      points = [];
      startTime = null;
      totalSteps = 0;
      renderHistory();
      refreshUI();
    }
  }

  // --- Eventy ---
  startBtn.addEventListener('click', startTracking);
  stopBtn.addEventListener('click', stopTracking);
  saveBtn.addEventListener('click', saveActivity);
  saveSnapshotBtn.addEventListener('click', saveSnapshot);
  clearBtn.addEventListener('click', clearData);

  renderHistory();
  refreshUI();

});
