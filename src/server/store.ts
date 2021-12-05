/*
    attempts to read .comet-cron.json in home directory
*/

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as helpers from '../helpers';
const fsPromises = fs.promises;

import { Config } from '../types';

// homedir
const homedir = os.homedir();


/* read config from file */
export async function readConfig(): Promise<Config> {

    // config path
    let filePath: string = path.join(homedir, '.comet-cron.json');

    try {

        // read config
        let contents: string = await fsPromises.readFile(filePath, { encoding: 'utf-8' });
        let config: Config = JSON.parse(contents, helpers.parseJsonDates) as Config;

        return config;
        
    } catch (error) {
        throw new Error('Unable to read Config');
    }    
}

/* overwrite config file */
export async function saveConfig(config: Config): Promise<boolean> {
    
    try {

        // config path
        let filePath: string = path.join(homedir, '.comet-cron.json');

        // write file
        await fsPromises.writeFile(filePath, JSON.stringify(config));

        return true;
        
    } catch (error) {
        throw new Error('Failed saving Jobs');
        
    }
}