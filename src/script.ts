import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { WMTSCapabilities } from "ol/format";
import WMTS, { optionsFromCapabilities } from "ol/source/WMTS";
import VelocityLayer from "./velocityLayer";
import data from './data'

const velocityOptions = {
  displayValues: true,
  displayOptions: {
    velocityType: 'GBR Wind',
    position: 'bottomleft',
    emptyString: 'No velocity data',
    angleConvention: 'bearingCW',
    displayPosition: 'bottomleft',
    displayEmptyString: 'No velocity data',
    speedUnit: 'm/s'
  },
  data: data, // see demo/*.json, or wind-js-server for example data service

  // OPTIONAL
  // minVelocity: 0,          // used to align color scale
  // maxVelocity: 10,         // used to align color scale
  velocityScale: 0.01,    // modifier for particle animations, arbitrarily defaults to 0.005
  particleMultiplier: 1/100,
  particleAge: 64,
  lineWidth: 1
}

function createBaseLayer(): TileLayer<WMTS> {
  const World_Light_Gray_Base_URL = 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/WMTS/1.0.0/WMTSCapabilities.xml'; 
  const layer = new TileLayer<WMTS>({});
  fetch(World_Light_Gray_Base_URL)
    .then((response) => response.text())
    .then((text) => {
      const parser = new WMTSCapabilities();
      const result = parser.read(text);
      const options = optionsFromCapabilities(result, {
        layer: 'Canvas_World_Light_Gray_Base',
        matrixSet: 'default028mm',
      });
      layer.setSource(new WMTS(options));
    });

  return layer;
}

window.addEventListener('DOMContentLoaded', () => {

  const map = new Map({
    target: 'mapid',
    layers: [createBaseLayer()],
    view: new View({ center: [0, 0], zoom: 2 })
  });
});
 

// let velocity = new VelocityLayer({

//   displayValues: true,
//   displayOptions: {
//     velocityType: 'GBR Wind',
//     position: 'bottomleft',
//     emptyString: 'No velocity data',
//     angleConvention: 'bearingCW',
//     displayPosition: 'bottomleft',
//     displayEmptyString: 'No velocity data',
//     speedUnit: 'm/s'
//   },
//   data: data, // see demo/*.json, or wind-js-server for example data service

//   // OPTIONAL
//   // minVelocity: 0,          // used to align color scale
//   // maxVelocity: 10,         // used to align color scale
//   velocityScale: 0.01,    // modifier for particle animations, arbitrarily defaults to 0.005
//   particleMultiplier: 1/100,
//   particleAge: 64,
//   lineWidth: 1
// });

function removeWind() {
  // velocity.removeFromMap();
}

function addWind() {
  // velocity.addToMap(mymap, document.getElementById('velocity-canvas'));
  //velocity.addToMap(mymap);
  // TODO: Figure out how to keep animation going without updating layer
  setInterval(function() {
       // velocity._canvasLayer.changed();
  }, 50); 
}



