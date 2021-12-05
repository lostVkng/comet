/*
    Server accepts requests (commands & data) from client. 
    Responds with result of commands after executed by CronManager.
*/

import * as net from 'net';
import { JsonWire } from './JsonWire';
import { CronManager } from './CronManager';
import * as store from './store';

import { ServerReq, ServerRes, Config } from '../types';

// Set process title
process.title = 'Comet Server';


/* Start the tcp server */
export async function startServer() {

    // create tcp server
    let server = net.createServer();

    // get Config file
    let config: Config = await store.readConfig();

    // Config setup
    let PORT: number = 1211;

    // initiate Cron Manager
    let cronManager = CronManager.getInstance(config);

    server.on('connection', async (sock: any) => {

        sock = new JsonWire(sock);

        sock.on('data', async (data: ServerReq) => {

            // construct response
            let res: ServerRes = {
                ok: true,
            }

            try {

                if (data.command === 'list') {
                    let list = await cronManager.list();
                    res.data = list;
                } else if (data.command === 'status') {
                    let status = await cronManager.status();
                    res.data = status;
                } else if (data.command === 'add') {
                    if (!data.job) throw new Error ('Invalid Job to add');
                    await cronManager.add(data.job)
                } else if (data.command === 'del') {
                    if (!data.name) throw new Error('Name required to delete job');
                    await cronManager.del(data.name);
                } else if (data.command === 'start') {
                    if (!data.name) throw new Error('Name required to start job');
                    await cronManager.start(data.name);
                } else if (data.command === 'stop') {
                    if (!data.name) throw new Error('Name required to stop job');
                    await cronManager.stop(data.name);
                } else if (data.command === 'kill') {
                    if (!data.name) throw new Error('Name required to kill job');
                    await cronManager.kill(data.name);
                } else if (data.command === 'refresh') {
                    await cronManager.refresh();
                } else {
                    throw new Error('Unrecognized Command');
                }
                
            } catch (error) {
                res.ok = false;
                res.error = error;
            }
            
            // send the response back
            sock.write(res);

        });

        sock.on('error', (err:any) => {
            console.log('server err')
            console.log(err);
        });
    });

    server.listen(PORT, '127.0.0.1', () => {

        console.log('TCP Server is running on port ' + PORT);
    });
}
