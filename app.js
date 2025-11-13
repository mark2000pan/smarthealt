require([
  "esri/Map",
  "esri/views/MapView",
  "esri/tasks/RouteTask",
  "esri/tasks/support/RouteParameters",
  "esri/tasks/support/FeatureSet",
  "esri/Graphic",
  "esri/widgets/Search",
  "esri/widgets/Locate"
], function(Map, MapView, RouteTask, RouteParameters, FeatureSet, Graphic, Search, Locate) {

  const map = new Map({ basemap: "streets-navigation-vector" });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [17.12, 48.15], // Bratislava default
    zoom: 13
  });

  const routeTask = new RouteTask({
    url: "https://utility.arcgis.com/usrsvcs/appservices/g9AuxTQPEgzAy5f3/rest/services/World/Route/NAServer/Route_World/solve"
  });

  const walkmode = {
    "type": "WALK",
    "id": "walking",
    "name": "Walking Distance",
    "timeAttributeName": "WalkTime",
    "distanceAttributeName": "Kilometers",
    "impedanceAttributeName": "Kilometers",
    "useHierarchy": false
  };

  const searchWidget = new Search({ view });
  view.ui.add(searchWidget, "top-right");

  const locateBtn = new Locate({ view });
  view.ui.add(locateBtn, "top-left");

  view.on("click", function(event) {
    if (view.graphics.length === 0) {
      addGraphic("start", event.mapPoint);
    } else if (view.graphics.length === 1) {
      addGraphic("finish", event.mapPoint);
      getRoute();
    } else {
      view.graphics.removeAll();
      addGraphic("start", event.mapPoint);
    }
  });

  function addGraphic(type, point) {
    const graphic = new Graphic({
      symbol: {
        type: "simple-marker",
        color: (type === "start") ? "#75b9be" : "#9991bf",
        size: "10px"
      },
      geometry: point
    });
    view.graphics.add(graphic);
  }

  function getRoute() {
    const routeParams = new RouteParameters({
      stops: new FeatureSet({ features: view.graphics.toArray() }),
      travelMode: walkmode,
      returnDirections: true
    });

    routeTask.solve(routeParams).then(function(data) {
      const distance = data.routeResults[0].directions.totalLength * 1609.344;
      const steps = Math.trunc(distance / 0.762);
      const calories = Math.trunc(steps * 0.04);

      data.routeResults.forEach(function(result) {
        result.route.symbol = {
          type: "simple-line",
          color: [40, 160, 240, 0.7],
          width: 5
        };
        view.graphics.add(result.route);
      });

      const infoBox = document.getElementById("bebas");
      infoBox.innerHTML = `
        You will walk for <b>${distance.toFixed(0)}</b> meters,<br>
        <b>${steps}</b> steps and burn approximately<br>
        <b>${calories}</b> calories.`;
      infoBox.classList.add("show");
    });
  }
});
