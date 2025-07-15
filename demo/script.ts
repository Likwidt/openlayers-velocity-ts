import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { WMTSCapabilities } from "ol/format";
import WMTS, { optionsFromCapabilities } from "ol/source/WMTS";
import VelocityLayer from "../src/velocityLayer";
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
  const v_layer = new VelocityLayer(velocityOptions);

  new Map({
    target: 'mapid',
    layers: [createBaseLayer(), v_layer.getMapLayer()],
    view: new View({ center: [0, 0], zoom: 2 })
  });

  v_layer.setData(data as any)

  
});



