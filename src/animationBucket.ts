import ColorScale from "./colorScale";
import Particule from "./particle";
import Vector from "./vector";

export default class AnimationBucket {
    private colorScale: ColorScale;
    private buckets: Particule[][] = [];

    constructor (colorScale: ColorScale) {
        this.colorScale = colorScale;
        for (let i = 0 , n = colorScale.size; i < n; i++) {
            this.buckets.push([]);
        }
    }

    public clear(): void {
        // Clear all buckets
        for (let i = 0, n = this.buckets.length; i < n; i++) { this.buckets[i] = []; }
    }

    public add(p: Particule, v: Vector): void {
        const index = this.colorScale.getColorIndex(p.intensity)
        if (index < 0 || index >= this.buckets.length) { return; }
        p.xt = p.x + v.u;
        p.yt = p.y + v.v;
        this.buckets[index].push(p);
    }

    public draw (context2D: any): void {
        for (let i = 0, n = this.buckets.length; i < n; i++) {
            const bucket = this.buckets[i];

            if (bucket.length > 0) {
                context2D.beginPath();
                context2D.strokeStyle = this.colorScale.colorAt(i);
                bucket.forEach(function(particle) {
                    context2D.moveTo(particle.x, particle.y);
                    context2D.lineTo(particle.xt, particle.yt);
                    particle.x = particle.xt;
                    particle.y = particle.yt;
                });
                context2D.stroke();
            }
        };
    }
}