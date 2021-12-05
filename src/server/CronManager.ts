/* 
    Manages all Cron jobs
*/

import { Job, Config } from '../types';
import { JobProc } from './JobProc';
import * as store from './store';
import * as helpers from '../helpers';


export class CronManager {

    private static _instance: CronManager;

    // Comet Config
    config: Config

    // Active Running Jobs
    activeJobs: Array<JobProc> = [];

    // All Comet managed Cron Jobs
    allJobs: Array<Job> = [];

    // timer till next cron task
    timer: any = null;

    private constructor (config: Config) {

        // set config
        this.config = config;

        // set jobs
        this.allJobs = config.jobs;
        
        // likely don't need an immediate call
        store.readConfig().then((data: Config) => {
            this.config = data
        });

        // call overdue cron tasks
        this.refresh();
    }

    // return current instance
    static getInstance(config: Config): CronManager {

        // create instance if it doesn't already exist
        if(!this._instance) {
            this._instance = new CronManager(config);
        }

        return this._instance;
    }

    async updateCronTimer() {

        // find nearest job time
        let jobs: Array<Job> = this.allJobs.filter(v => v.nextRunTime !== undefined);

        // if no jobs, no timer
        if (jobs.length === 0) {
            this.timer = null;
            return;
        }

        let nearest: Job = jobs.reduce((prev, curr) => {

            // typescript specify they're dates even though we filter above
            let prevTime = prev.nextRunTime as Date;
            let currTime = curr.nextRunTime as Date;
            
            return prevTime < currTime ? prev : curr;
        });

        // update cron timer
        let now: Date = new Date();
        let nextRunTime: Date = nearest.nextRunTime as Date;

        let diffMs: number = nextRunTime.getTime() - now.getTime();

        let self = this;

        // create timer
        this.timer = setTimeout(async () => {
            self.runCronJobs();
        }, diffMs);
    }

    async runCronJobs() {

        let self = this;

        // run jobs when due
        let jobs = this.allJobs;

        // remove non active jobs
        jobs = jobs.filter((j: Job) => j.isActive === true);

        // get current time
        let now = new Date();

        // increment now by 1 min to ensure date isn't now + set seconds 0
        now.setTime(now.getTime() + 1000 * 60);
        now.setSeconds(0);

        // remove jobs not due by next minute
        jobs = jobs.filter((j: Job) => {

            // remove no next time jobs
            if (!j.nextRunTime) return false;

            // remove active running jobs
            if (self.activeJobs.some(x => x.job.name === j.name)) return false;

            // return jobs due
            return j.nextRunTime <= now;
        });

        // run the jobs
        jobs.forEach(async (j: Job) => {

            // create new job process (class) and run it
            let proc: JobProc = new JobProc(j);
            proc.on('exit', () => self.jobEnded(j.name));

            // update job next run time in allJobs
            let nextRunTime = await helpers.nextExecTime(j.cronExp, j.nextRunTime);
            j.lastRunStartTime = j.nextRunTime;
            j.nextRunTime = nextRunTime;

            // add to active jobs
            self.activeJobs.push(proc);
            
            // update allJobs
            let allJobsIndex: number = self.allJobs.findIndex(v => v.name === j.name);
            if (allJobsIndex < 0) return;
            self.allJobs[allJobsIndex] = j;
        })
    }

    public async refresh() {

        // calls any overdue cron calls
        await this.runCronJobs();
        this.updateCronTimer();
    }

    public async status() {
        return this.activeJobs.map(v => v.job);
    }

    public async list(): Promise<Array<Job>> {

        try {
            if (!this.config) throw new Error('Config not ready');

            return this.config.jobs

        } catch (error) {
            throw new Error('Cannot get list');
        }
    }

    public async add(job: Job): Promise<boolean> {

        // add new Cron Job & activate

        // add to CronManager
        this.allJobs.push(job);
        this.config.jobs = this.allJobs;

        try {
            // update DB
            await this.saveConfig();

            // calc next cron call
            this.updateCronTimer();
            
        } catch (error) {
            throw error;
        }

        return true;
    }

    public async del(name: string) {

        // kill job if it exists to prevent saving over + kill errs
        if (this.activeJobs.find(x => x.job.name === name)) await this.kill(name);

        // remove
        let jobIndex: number = this.allJobs.findIndex((j: Job) => j.name === name);

        if (jobIndex >= 0) this.allJobs = this.allJobs.filter((j: Job) => j.name !== name);

        try {
            // update DB
            await this.saveConfig();

            // calc next cron call
            this.updateCronTimer();
            
        } catch (error) {
            throw error;
        }
    }

    public async start(name: string) {

        // enable job to run
        let jobs = this.allJobs;
        let jobIndex: number = jobs.findIndex((j: Job) => j.name === name);

        if (jobIndex === -1) throw new Error('Start: cannot find job');

        let job: Job = jobs[jobIndex];

        // set active & calc next run time
        job.isActive = true;
        job.nextRunTime = await helpers.nextExecTime(job.cronExp);

        // update jobs
        jobs[jobIndex] = job;
        this.allJobs = jobs;
        
        try {
            // update DB
            await this.saveConfig();

            // calc next cron call
            this.updateCronTimer();
            
        } catch (error) {
            throw error;
        }
    }

    public async stop(name: string) {

        // enable job to run
        let jobs = this.allJobs;
        let jobIndex: number = jobs.findIndex((j: Job) => j.name === name);

        if (jobIndex === -1) throw new Error('Stop: cannot find job');

        let job: Job = jobs[jobIndex];

        // set active & calc next run time
        job.isActive = false;
        job.nextRunTime = undefined;

        // update jobs
        jobs[jobIndex] = job;
        this.allJobs = jobs;
        
        try {
            // update DB
            await this.saveConfig();

            // calc next cron call
            this.updateCronTimer();
            
        } catch (error) {
            throw error;
        }
    }

    public async kill(name: string) {

        let index: number = this.activeJobs.findIndex(x => x.job.name === name);
        let proc: JobProc = this.activeJobs[index];

        // kill job, emit killed will remove it
        proc.kill();
    }

    public async jobEnded(name: string) {

        // update job info
        let allIndex: number = this.allJobs.findIndex(x => x.name === name); 

        // del jobs remove them so no updating
        if (allIndex > 0) {
            let job: Job = this.allJobs[allIndex];
            job.lastRunStopTime = new Date();
            if (job.lastRunStartTime) {
                job.lastRunJobTime = job.lastRunStopTime.getMilliseconds() - job.lastRunStartTime.getMilliseconds();
            }
            this.allJobs[allIndex] = job
        }

        // remove active job
        let activeIndex: number = this.activeJobs.findIndex(x => x.job.name === name);    
        this.activeJobs.splice(activeIndex, 1);

        try {
            // update DB
            await this.saveConfig();
            
        } catch (error) {
            throw error;
        }
    }

    async saveConfig() {

        try {
            // get current config
            let config = this.config;

            // update jobs
            config.jobs = this.allJobs;

            // update storage file
            await store.saveConfig(config);
            
        } catch (error) {
            throw error;
        }
    }
}