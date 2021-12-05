/* 
    Runs Cron job in child process, controlled by CronManager
*/

import { EventEmitter } from 'stream';
import { spawn } from 'child_process';

import { Job } from '../types';


export class JobProc extends EventEmitter {

    job: Job;
    proc: any;
    pid?: number;

    constructor(job: Job) {
        super();

        this.job = job;

        // run process
        this.run();
    }

    async run() {

        let self = this;

        this.proc = spawn(this.job.cliArgs[0], this.job.cliArgs.slice(1))
        this.pid = this.proc.pid;

        try {

            // process events
            this.proc.stdout.on('data', (d:any) => {
                console.log(d.toString());
            });

            // error on job, stop
            this.proc.stderr.on('data', (err:any) => {

                // if there is an error, exit the job
                self.kill();
            });

            // exit event
            this.proc.on('exit', (e:any) => {

                self.emit('exit');
            });

            // spawn error
            this.proc.on('error', (e:any) => {
                self.kill();
            });
            
        } catch (error) {
            throw error;
        }
    }

    async kill() {

        // kill the process
        this.proc.kill();

        // emit exit
        this.emit('exit');
    }
}