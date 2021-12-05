/* 
    json wire

    custom json wire protocol to send json data over tcp streams

    Header   |  Payload - json body
    4 bytes  |  

    // Good chunk is built off this blog post, its an excellent read
    // http://derpturkey.com/extending-tcp-socket-in-node-js/
*/

import { Duplex } from 'stream';
import { Socket } from 'net';
import * as helpers from '../helpers';

import { ServerAddress } from '../types';


export class JsonWire extends Duplex {

    _socket:any;
    _readingPaused: boolean;

    constructor(socket?: any){
        super({objectMode: true});

        // used to control reading
        this._readingPaused = false;

        // wrap the socket if one was provided
        if (socket) this._wrapSocket(socket);
    }

    connect(server: ServerAddress) {

        this._wrapSocket(new Socket());

        let s: ServerAddress = {
            host: server.host,
            port: server.port
        }

        this._socket.connect(s);

        return this;
    }

    _wrapSocket(socket: any) {

        this._socket = socket;

        // pass through methods
        this._socket.on('connect', () => this.emit('connect'));
        this._socket.on('drain', () => this.emit('drain'));
        this._socket.on('end', () => this.emit('end'));
        this._socket.on('error', (err:any) => this.emit('error', err));
        this._socket.on('lookup', (err:any, address:any, family:any, host:any) => 
            this.emit('lookup', err, address, family, host));
        this._socket.on('ready', () => this.emit('ready'));
        this._socket.on('timeout', () => this.emit('timeout'));

        // tbd
        this._socket.on('readable', this._onReadable.bind(this));

    }

    _onReadable() {

        while(!this._readingPaused) {

            // read raw length
            let lenBuf = this._socket.read(4);
            if(!lenBuf) return;

            let len = lenBuf.readUInt32BE();

            // read json data
            let body = this._socket.read(len);
            if(!body) {
                this._socket.unshift(lenBuf);
                return;
            }

            // convert raw json to js object
            let json;
            try {
                json = JSON.parse(body, helpers.parseJsonDates);
            } catch(ex) {
                this._socket.destroy(ex);
                return;
            }

            // add object to read buffer
            let pushOk = this.push(json);

            // pause reading
            if(!pushOk) this._readingPaused = true;
        }
    }

    _read() {
        this._readingPaused = false;
        setImmediate(this._onReadable.bind(this));
    }

    _write(obj: any, encoding: any, cb: any) {  
        let json = JSON.stringify(obj);
        let jsonBytes = Buffer.byteLength(json);
        let buffer = Buffer.alloc(4 + jsonBytes);
        buffer.writeUInt32BE(jsonBytes);
        buffer.write(json, 4);
        this._socket.write(buffer, encoding, cb);
    }

    _final(cb: any) {
        this._socket.end(cb);
      }
}
