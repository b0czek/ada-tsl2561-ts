export enum Gains {
    "1X",
    "16X",
}

export enum IntegrationTimes {
    "13.7ms",
    "101ms",
    "402ms",
    "manual",
}

export default class Tsl2561 {
    init(busNumber: number, deviceAddress: number): Promise<Tsl2561>;
    free(): Promise<Tsl2561>;
    enable(): Promise<Tsl2561>;
    disable(): Promise<Tsl2561>;
    isEnabled(): Promise<boolean>;
    getBroadband(): Promise<number>;
    getInfrared(): Promise<number>;
    getGain(): Promise<Gains>;
    setGain(newGain: Gains): Promise<Tsl2561>;
    getLux(): Promise<number>;
    getIntegrationTime(): Promise<IntegrationTimes>;
    setIntegrationTime(newIntegrationTime: IntegrationTimes): Promise<Tsl2561>;
}
