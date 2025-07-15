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

export default class VelocityLayer {

  private _options: VelocityLayerOptions;
  private _map: Map = null;
  private _canvasSize: Size = null;
  private _windy: Windy = null;

  private _canvas = document.createElement('canvas');
  private _canvasSource = new ImageCanvasSource({ canvasFunction: this._canvasFunction.bind(this), projection: 'EPSG:3857' });
  private _canvasLayer: ImageLayer<ImageCanvasSource> = new ImageLayer({ source: this._canvasSource });

  constructor(options: Partial<VelocityLayerOptions>) {
    this._options = Object.assign(DEFAULT_VELOCITY_LAYEROPTIONS, options || {});
    this._windy = new Windy(this._canvas, this._options);
  }

  public getMapLayer() {
    this._initMap();
    return this._canvasLayer;
  }

  public clear(): void {
    this._windy.stop();
  }

  public setData(data: [VelocityData, VelocityData]): void {
    this._options.data = data;

    this._windy.setData(data);
    this._canvasSource.changed();
  }

  public get visibility(): boolean {
    return this._canvasLayer.getVisible();
  }

  public set visibility(visible: boolean) {
    this._canvasLayer.setVisible(visible);
    if (visible) {
      this._startWindy();
    } else {
      this.clear();
    }
  }

  private async _initMap(): Promise<void> {
    if (this._map instanceof Map) { return; }
    while (this._map === null) {
      await new Promise<void>(resolve => setTimeout(() => {
        const _map = this._canvasLayer.getMapInternal();
        if (_map instanceof Map) {
          this._map = _map;
          this._map.on('movestart', () => this.clear());
          this._map.on('moveend', () => this._canvasSource.changed());
        }
        resolve();
      }, 0));
    }
  }

  private _canvasFunction(extent: any, resolution: any, pixelRatio: any, size: any, projection: any) {
    if (!this._map) { return; }

    this._canvas.setAttribute('width', size[0].toString());
    this._canvas.setAttribute('height', size[1].toString());
    this._canvasSize = size;
    
    this._restartWindy()

    return this._canvas;
  }

  private _startWindy(): void {
    if (!this._canvasLayer.getVisible() || !this._options.data || !this._canvasSize) { return; }

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
    if (this.visibility !== true) { return; }
    if (data) { this._windy.setData(data);}
    this._startWindy();
  }
}
