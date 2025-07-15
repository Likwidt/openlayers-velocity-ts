export type ColorScaleValues = string[];

export type VelocityData = {
    header: {
        dx: number,
        dy: number,
        la1: number,
        lo1: number,
        la2: number,
        lo2: number,
        numberPoints: number,
        nx: number,
        ny: number,
        parameterCategory: number,
        parameterNumber: number,
        parameterNumberName: string,
        parameterUnit: string,
        time: string,
    }
    data: number[]
}

export type VelocityLayerOptions = {
    displayValues?: boolean,
    displayOptions?: {
        velocityType?: string,
        position?: string,
        emptyString?: string,
        angleConvention?: string,
        speedUnit?: string
    },
    maxVelocity?: number,
    minVelocity?: number,
    colorScale?: ColorScaleValues,
    data?: any,
    frameRate?: number,
    velocityScale?: number,
    particleMultiplier?: number,
    particleAge?: number,
    lineWidth?: number
}