#!/usr/bin/env node

/* 
    cli.ts
    Handles user entered cli commands
*/

import { Client } from './client/Client';
import * as server from './server/server';
import * as ascii from './client/ascii_tables';
import * as helpers from './helpers';

// Types
import { Job } from './types';


async function main(): Promise<void> {

    let args: Array<string> = process.argv.slice(2);

    // server start doesn't have a client
    if (args[0] === 'server') {

        server.startServer();
        return;

    } else if(args[0] === '--version') {

        let packageJson = require('../package.json');
        console.log(packageJson.version);
        return;

    } else if(args[0] === '--help') {

        let s: string = '';

        // title
        s += 'Usage: comet <command> [optional|required flags] [arguments]';
        s += '\n\n';

        // commands
        s += 'comet <server>            | Launch comet server\n';
        s += 'comet <list>              | Lists all cron jobs\n';
        s += 'comet <status>            | Lists actively running jobs\n';
        s += 'comet <add> [-name=]      | Creates cron job with name\n';
        s += 'comet <del> [name]        | Kills and deletes job\n';
        s += 'comet <start> [name]      | Starts inactive job\n';
        s += 'comet <stop> [name]       | Stops and sets job inactive\n';
        s += 'comet <kill> [name]       | Kills active running job\n';
        s += 'comet <refresh>           | Refreshes job timers, used on resume/login\n';
        s += '\n';
        s += 'comet [--version]         | Prints version\n';
        s += 'comet [--help]            | Prints help\n';
        s += '\n';

        console.log(s);
        return;
    } 

    
    try {

        // establish client
        let client = new Client();

        // handle commands
        if(args[0] === 'status') {

            // server response
            let res = await client.req('status');

            if(!res.ok) throw res.error;

            let rows: Array<Array<string>> = [];
            res.data.map((j: Job) => {

                let now: Date = new Date();
                let lastStart: Date = j.lastRunStartTime as Date;
                let timeElapsedMs: number = Math.abs(now.getTime() - lastStart.getTime());
                let timeElapsed: string = helpers.msToString(timeElapsedMs);

                let row: Array<string> = [
                    j.name ? j.name : '', 
                    j.lastRunStartTime ? j.lastRunStartTime.toISOString() : '', 
                    j.nextRunTime ? j.nextRunTime.toISOString() : '',
                    timeElapsed,
                ];


                rows.push(row);
            });

            let terminal = ascii.table(['name', 'StartTime', 'NextRunTime', 'Elapsed'], rows);

            console.log('Active Jobs: \n')
            console.log(terminal);

        } else if(args[0] === 'list') {

            // server response
            let res = await client.req('list');

            if(!res.ok) throw res.error;

            let rows: Array<Array<string>> = [];
            res.data.map(async (j: Job) => {
                
                let row: Array<string> = [
                    j.isActive.toString(), 
                    j.nextRunTime ? j.nextRunTime.toISOString() : '', 
                    j.cronExp, 
                    j.name ? j.name : '', 
                    j.lastRunStartTime ? j.lastRunStartTime.toISOString() : '', 
                    j.lastRunStopTime ? j.lastRunStopTime.toISOString() : '', 
                    j.lastRunJobTime ? helpers.msToString(j.lastRunJobTime) : ''
                ];

                rows.push(row);
            });

            let terminal = ascii.table(['isActive', 'Next Run Time', 'Cron Exp.', 'Name', 'LastStartTime', 'LastStopTime', 'LastJobTime'], rows);

            console.log(terminal);

        } else if(args[0] === 'add') {
            
            // check if -name= was included in any arg
            let nameIndex: number = args.findIndex(v => v.includes('-name='));

            // -name= is required
            if (nameIndex === -1) throw new Error('-name was not included');

            let name = args[nameIndex].replace('-name=', '');

            // remove name arg from args
            args.splice(nameIndex, 1);

            // validate cron expression
            let _nextExecTime: Date = await helpers.nextExecTime(args[1]);
            
            // create Job
            let job: Job = {
                cronExp: args[1],
                cliArgs: args.slice(2),
                nextRunTime: _nextExecTime,
                isActive: true,
                name: name,
            };

            // server response
            let res = await client.req('add', job);

            if(!res.ok) throw res.error;

        } else if(args[0] === 'del') {

            // server response
            let res = await client.req('del', undefined, args[1]);

            if(!res.ok) throw res.error;

        } else if(args[0] === 'start') {

            // server response
            let res = await client.req('start', undefined, args[1]);

            if(!res.ok) throw res.error;

        } else if(args[0] === 'stop') {

            // server response
            let res = await client.req('stop', undefined, args[1]);

            if(!res.ok) throw res.error;

        } else if(args[0] === 'kill') {

            // server response
            let res = await client.req('kill', undefined, args[1]);

            if(!res.ok) throw res.error;

        } else if(args[0] === 'refresh') {

            // server response
            let res = await client.req('refresh');

            if(!res.ok) throw res.error;

        } else {
            console.log('Unable to parse args');

            // manual close
            client.close();
        }
        
    } catch (error) {
        console.log(error)
    }

    return;
}

main();