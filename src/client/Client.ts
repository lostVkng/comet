/*
    Client to send and receive data from server
*/

import { JsonWire } from '../server/JsonWire';

import { ServerReq, ServerRes, Job, Config } from '../types';


export class Client {
    
    socket: any;

    constructor() {

        this.socket = new JsonWire();
        this.socket.connect({ host: '127.0.0.1', port: 1211 });
    }

    public async req(command: string, job?: Job, name?: string): Promise<ServerRes> {
        
        let _client = this.socket;

        // craft request
        let req: ServerReq = {
            command: command,
            job: job,
            name: name,
        };

        return new Promise((resolve, reject) => { 
            
            // send message to server
            _client.write(req);

            // wait for data
            _client.on('data', (res: ServerRes) => {

                // close the connection
                _client.end();

                // send data back
                resolve(res);
            });

            // or error
            _client.on('error', (err:any) => {
                
                // close the connection
                _client.end();

                // send data back
                reject(err);
            });
        });

    }

    public async close() {
        // close the connection
        this.socket.end();
    }
}