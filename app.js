// Mini Health s mapou (Leaflet + GPS + kroky)
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const saveBtn = document.getElementById('saveBtn');
  const gpsStatus = document.getElementById('gpsStatus');
  const distanceEl = document.getElementById('distance');
  const timeEl = document.getElementById('time');
  const speedEl = document.getElementById('speed');
  const stepsEl = document.getElementById('steps');
  const historyEl = document.getElementById('history');
  const activityType = document.getElementById('activityType');

  // mapa
  const map = L.map('map').setView([48.15, 17.12], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  let routeLine = L.polyline([], { color: '#28a0f0', weight: 4 }).addTo(map);
  let watchId = null;
  let points = [];
  let startTime = null;
  let timer = null;
  const stepLength = 0.75; // m

  const toRad = deg => deg * Math.PI / 180;
  const haversine = (a,b)=>{
    const R=6371000,dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon);
    const lat1=toRad(a.lat),lat2=toRad(b.lat);
    const A=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return 2*R*Math.atan2(Math.sqrt(A),Math.sqrt(1-A));
  };
  const totalDist = pts => pts.slice(1).reduce((s,p,i)=>s+haversine(pts[i],p),0);
  const fmtTime = ms=>{
    const s=Math.floor(ms/1000);
    const h=String(Math.floor(s/3600)).padStart(2,'0');
    const m=String(Math.floor((s%3600)/60)).padStart(2,'0');
    const sec=String(s%60).padStart(2,'0');
    return ${h}:${m}:${sec};
  };

  function refreshUI(){
    const dist=totalDist(points);
    const t=startTime?Date.now()-startTime:0;
    const km=dist/1000;
    const kmh=km/(t/3600000);
    const steps=Math.round(dist/stepLength);
    distanceEl.textContent=km.toFixed(2)+' km';
    timeEl.textContent=fmtTime(t);
    speedEl.textContent=(kmh||0).toFixed(1)+' km/h';
    stepsEl.textContent=steps;
  }

  function onPos(pos){
    const c=pos.coords;
    const pt={lat:c.latitude,lon:c.longitude,accuracy:c.accuracy};
    points.push(pt);
    gpsStatus.textContent=`GPS: ${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)} (±${c.accuracy}m)`;
    refreshUI();

    // aktualizuj trasu na mape
    routeLine.addLatLng([pt.lat, pt.lon]);
    if(points.length===1) map.setView([pt.lat, pt.lon],15);
  }

  function onErr(err){
    gpsStatus.textContent='Chyba GPS: '+err.message;
  }

  function startTracking(){
    if(!navigator.geolocation){
      alert('Geolokácia nie je podporovaná.');
      return;
    }
    points=[];
    routeLine.setLatLngs([]);
    startTime=Date.now();
    gpsStatus.textContent='Sledovanie spustené...';
    startBtn.disabled=true;
    stopBtn.disabled=false;
    saveBtn.disabled=true;
    watchId=navigator.geolocation.watchPosition(onPos,onErr,{enableHighAccuracy:true,maximumAge:1000,timeout:10000});
    timer=setInterval(refreshUI,1000);
  }

  function stopTracking(){
    if(watchId){navigator.geolocation.clearWatch(watchId);watchId=null;}
    clearInterval(timer);
    timer=null;
    startBtn.disabled=false;
    stopBtn.disabled=true;
    saveBtn.disabled=false;
    gpsStatus.textContent='Sledovanie zastavené.';
    refreshUI();
  }

  function saveActivity(){
    const dist=totalDist(points);
    const dur=Date.now()-startTime;
    const rec={
      id:Date.now(),
      type:activityType.value,
      start:new Date(startTime).toISOString(),
      dist_m:Math.round(dist),
      duration_ms:dur,
      steps:Math.round(dist/stepLength)
    };
    const hist=JSON.parse(localStorage.getItem('health_history')||'[]');
    hist.unshift(rec);
    localStorage.setItem('health_history',JSON.stringify(hist));
    renderHistory();
    alert('Aktivita uložená!');
  }

  function renderHistory(){
    const hist=JSON.parse(localStorage.getItem('health_history')||'[]');
    if(!hist.length){historyEl.innerHTML='<li>Žiadne aktivity</li>';return;}
    historyEl.innerHTML=hist.map(h=>`<li>
      <strong>${h.type}</strong> • ${(h.dist_m/1000).toFixed(2)} km • ${h.steps} krokov<br>
      ${new Date(h.start).toLocaleString()}
    </li>`).join('');
  }

  startBtn.addEventListener('click',startTracking);
  stopBtn.addEventListener('click',stopTracking);
  saveBtn.addEventListener('click',saveActivity);

  renderHistory();
});
