/* 
    Type Interfaces
*/

export interface ServerAddress {
    host: string,
    port: number
}

export interface Job {
    cliArgs: Array<string>;
    cronExp: string;
    nextRunTime?: Date;
    lastRunStartTime?: Date;
    lastRunStopTime?: Date;
    lastRunJobTime?: number;
    isActive: boolean;
    name: string;
}

export interface ServerReq {
    command: string;
    job?: Job;
    name?: string;
}

export interface ServerRes {
    ok: boolean;
    data?: any;
    error?: any;
}

export interface Config {
    jobs: Array<Job>;
}