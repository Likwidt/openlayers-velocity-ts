import Windy from './windy';
import CanvasBound from './canvasBound'
import MapBound from './mapBound';
import Layer from './layer';
import ImageLayer from 'ol/layer/Image';
import ImageCanvasSource from 'ol/source/ImageCanvas';
import { transformExtent } from 'ol/proj';
import { VelocityData, VelocityLayerOptions } from './types';
import { Map } from 'ol';
import { Size } from 'ol/size';

const DEFAULT_VELOCITY_LAYEROPTIONS = <VelocityLayerOptions>{
    displayValues: true,
    displayOptions: {
      velocityType: 'Velocity',
      position: 'bottomleft',
      emptyString: 'No velocity data',
      angleConvention: 'bearingCCW',
      speedUnit: 'm/s'
    },
    maxVelocity: 10, // used to align color scale
    colorScale: null,
    data: null
  };

export default class VelocityLayer extends ImageLayer<ImageCanvasSource> {

  private _options: VelocityLayerOptions;
  private _map: Map = null;
  private _canvasSize: Size = null;
  private _windy: Windy = null;

  private _canvas = document.createElement('canvas');
  private _canvasSource = new ImageCanvasSource({ canvasFunction: this._canvasFunction.bind(this), projection: 'EPSG:3857' });
  // private _canvasLayer: ImageLayer<ImageCanvasSource> = new ImageLayer({ source: this._canvasSource });

  constructor(options: Partial<VelocityLayerOptions>) {
    super({ visible: true, source: null });
    this.setSource(this._canvasSource);
    this._options = Object.assign(DEFAULT_VELOCITY_LAYEROPTIONS, options || {});
    this._windy = new Windy(this._canvas, this._options);
    
  }

  public addToMap(map: Map): void {
    map.getLayers().push(this as any);
    this._initMap(map);
  }

  public clear(): void {
    this._windy.stop();
  }

  public setData(data: [VelocityData, VelocityData]): void {
    this._options.data = data;

    this._windy.setData(data);
    this._canvasSource.refresh();
  }

  private _initMap(map: Map): void {
    this._map = map;
    this._map.on('movestart', () => this.clear());
    this._map.on('moveend', () => this._canvasSource.changed());
  }

  private _canvasFunction(extent: any, resolution: any, pixelRatio: any, size: any, projection: any) {
    if (!this._map) { return; }

    console.log('VelocityLayer._canvasFunction', extent, resolution, pixelRatio, size, projection);

    this._canvas.setAttribute('width', size[0].toString());
    this._canvas.setAttribute('height', size[1].toString());
    this._canvasSize = size;
    
    this._restartWindy()

    return this._canvas;
  }

  private _startWindy(): void {
    if (!this._map || !this.getVisible() || !this._options.data || !this._canvasSize) { return; }

    const extent = this._map.getView().calculateExtent(this._canvasSize);
    const extentLL = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');

    this._windy.start(
      new Layer(
        new MapBound(
          extentLL[3], // maxy (north)
          extentLL[2], // maxx (east)
          extentLL[1], // miny (south)
          extentLL[0]  // minx (west)
        ),
        new CanvasBound(0, 0, this._canvasSize[0], this._canvasSize[1])
      ),
      this._map
    );}

  private _restartWindy(data?: [VelocityData, VelocityData]): void {
    this.clear();
    if (this.getVisible() !== true) { return; }
    if (data) { this._windy.setData(data);}
    this._startWindy();
  }
}
