import Vector from "./vector";
import Grid from "./grid";
import ColorScale from "./colorScale";
import Particule from "./particle";
import AnimationBucket from "./animationBucket";
import Layer from "./layer";
import { Map } from "ol";
import { VelocityData } from "./types";

export default class Windy {

  private grid: any;
  private λ0: number;
  private φ0: number;
  private Δλ: number;
  private Δφ: number;
  private ni: number;
  private nj: number;
  private colorScale: ColorScale;
  private velocityScale: number;
  private particuleMultiplier = 1 / 300;
  private particleAge: number;
  private particuleLineWidth: number;
  private autoColorRange = false;

  private layer: Layer;
  private particules: Particule[] = [];
  private animationBucket: AnimationBucket;
  private context2D: CanvasRenderingContext2D;
  private animationLoop: (number | NodeJS.Timeout) = null;
  private frameTime: number;


  constructor(private canvas: HTMLCanvasElement, private options: any) {
    this.context2D = canvas.getContext("2d");
    this.autoColorRange = options.minVelocity === undefined && options.maxVelocity === undefined;
    this.colorScale = new ColorScale(options.minVelocity || 0, options.maxVelocity || 10, options.colorScale);
    this.velocityScale = options.velocityScale || 0.01;
    this.particleAge = options.particleAge || 64;
    this.setData(options.data);
    this.particuleMultiplier = options.particleMultiplier || 1 / 300;
    this.particuleLineWidth = options.lineWidth || 1;
    const frameRate = options.frameRate || 15;
    this.frameTime = 1000 / frameRate;
  }

  private get particuleCount() {
    const particuleReduction = ((/android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i).test(navigator.userAgent)) ? (Math.pow(window.devicePixelRatio, 1 / 3) || 1.6) : 1;
    return Math.round(this.layer.canvasBound.width * this.layer.canvasBound.height * this.particuleMultiplier) * particuleReduction;
  }

  public setData(data?: [VelocityData, VelocityData]): void {
    if (!data || !Array.isArray(data) || data.length !== 2) {
      return;
    }

    let uData: any = null;
    let vData: any = null;
    const grid: Vector[] = [];

    data.forEach((record) => {
      switch (`${record.header.parameterCategory},${record.header.parameterNumber}`) {
        case "1,2":
        case "2,2":
          uData = record;
          break;
        case "1,3":
        case "2,3":
          vData = record;
          break;
        default:
      }
    });

    if (!uData || !vData) {
      console.warn("Data are not correct format");
      return;
    }

    uData.data.forEach((u: number, index: number) => {
      grid.push(new Vector(u, vData.data[index]));
    })

    this.grid = new Grid(
      grid,
      uData.header.la1,
      uData.header.lo1,
      uData.header.dy,
      uData.header.dx,
      uData.header.ny,
      uData.header.nx
    );

    this.λ0 = uData.header.lo1;
    this.φ0 = uData.header.la1;

    this.Δλ = uData.header.dx;
    this.Δφ = uData.header.dy

    this.ni = uData.header.nx;
    this.nj = uData.header.ny; // number of grid points W-E and N-S (e.g., 144 x 73)

    var p = 0;
    var isContinuous = Math.floor(this.ni * this.Δλ) >= 360;

    for (var j = 0; j < this.nj; j++) {
      var row = [];
      for (var i = 0; i < this.ni; i++, p++) {
        row[i] = this.grid.data[p];
      }
      if (isContinuous) {
        // For wrapped grids, duplicate first column as last column to simplify interpolation logic
        row.push(row[0]);
      }
      this.grid[j] = row;
    }

    if (this.autoColorRange) {
      const minMax = this.grid.valueRange;
      this.colorScale.setMinMax(minMax[0], minMax[1]);
    }
  }

  private getParticuleWind(p: Particule): Vector {
    const lngLat = this.layer.canvasToMap(p.x, p.y);
    const wind = this.grid.get(lngLat[0], lngLat[1]);
    p.intensity = wind.intensity;
    const mapArea = this.layer.mapBound.height * this.layer.mapBound.width;
    var velocityScale = this.velocityScale * Math.pow(mapArea, 0.4);
    this.layer.distort(lngLat[0], lngLat[1], p.x, p.y, velocityScale, wind);
    return wind;
  }

  public start(layer: Layer, map: Map) {

    this.context2D = this.canvas.getContext("2d");
    this.context2D.lineWidth = this.particuleLineWidth;
    this.context2D.fillStyle = "rgba(0, 0, 0, 0.97)";
    this.context2D.globalAlpha = 0.6;

    this.layer = layer;
    this.animationBucket = new AnimationBucket(this.colorScale);

    this.particules = [];
    for (let i = 0; i < this.particuleCount; i++) {
      this.particules.push(this.layer.canvasBound.getRandomParticule(this.particleAge));
    }

    this.frame(map);
  }

  private frame(map: Map): void {
    if (this.options.frameRate) {
      this.animationLoop = setTimeout(() => this.frame(map), this.frameTime);
    } else {
      this.animationLoop = requestAnimationFrame(() => this.frame(map));
    }
   
      this.evolve();
      this.draw();
      map.render();
  }

  private evolve(): void {
    this.animationBucket.clear();
    this.particules.forEach((p: Particule) => {
      p.grow();
      if (p.isDead) {
        this.layer.canvasBound.resetParticule(p);
      }
      const wind = this.getParticuleWind(p);
      this.animationBucket.add(p, wind);
    });
  }

  private draw(): void {
    this.context2D.globalCompositeOperation = "destination-in";
    this.context2D.fillRect(
      this.layer.canvasBound.xMin,
      this.layer.canvasBound.yMin,
      this.layer.canvasBound.width,
      this.layer.canvasBound.height
    );
    // Fade existing particle trails.
    this.context2D.globalCompositeOperation = "lighter";
    this.context2D.globalAlpha = 0.9;

    this.animationBucket.draw(this.context2D);
  }

  public stop(): void {
    this.particules.length = 0;;
    if (this.animationBucket) {
        this.animationBucket.clear();
    }
    if (this.animationLoop) {
      if (this.options.frameRate) {
        clearTimeout(this.animationLoop as NodeJS.Timeout);
      } else {
        cancelAnimationFrame(this.animationLoop as number);
      }

      this.animationLoop = null;
      this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

}
