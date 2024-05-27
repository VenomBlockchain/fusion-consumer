import * as fs from 'fs';
import * as path from 'path';
import { stringify } from 'yaml';
import { spawn } from 'child_process';
import { Installer } from './installer';
import { Transport } from './transport';
import { TransportStdio } from './transport-stdio';
import { TransportHttp2 } from './transport-http2';
import {
    Config,
    TransportKind,
    MessageFilter,
    ContractType,
    AddressOrCodeHash
} from './types';
import { MessageDecoder } from './message-decoder';
import { TransportMock } from './transport-mock';

export class Indexer {

    protected readonly config: Config;
    protected readonly skipStart: boolean;
    protected readonly transport: Transport;
    protected readonly transportType;

    constructor() {
        const fusionConfigPath = path.join(process.cwd(), 'fusion.json');
        if (!fs.existsSync(fusionConfigPath)) {
            throw Error(`File ${fusionConfigPath} does not exist`);
        }

        this.config = JSON.parse(fs.readFileSync(fusionConfigPath, 'utf8'));

        this.skipStart = false;

        switch (this.config.transport.kind) {
            case TransportKind.http2: {
                const messageDecoder = new MessageDecoder([], '');
                this.transport = new TransportHttp2('http://'+this.config.transport.listen_address ?? this.http2Url(), messageDecoder);
                // if (this.config.transport.listen_address) {
                //     this.skipStart = true;
                // }
                break;
            } case TransportKind.stdio: {
                this.transport = new TransportStdio();
                break;
            } case TransportKind.mock: {
                this.transport = new TransportMock(this.config);
                break;
            } default: {
                throw Error('unsupported transport type');
            }
        }
    }

    run(subscribers: any) {
        console.log('Running the run function with subscribers:', subscribers);
        
        if (!this.skipStart) {
            console.log('skipStart is false, proceeding with the function');
            const { fullPath, execFullPath } = Installer.EnsureInstall(this.config.install_path);
    
            this.GenerateIndexerConfig(fullPath);
    
            // run indexer
            const dataFolder = this.getDataFolder(fullPath);
            const { dir, base } = path.parse(execFullPath);
            const child = spawn(
                './' + base,
                [
                    '--config', `${dataFolder}/config.yaml`,
                    '--global-config', `${dataFolder}/global.config.json`
                ],
                {
                    cwd: dir
                }
            );
    
            console.log('Spawned child process with base:', base);
    
            if (!this.transport.onProcessStarted(child)) {
                child.stdout.on('data', process.stdout.write);
            }
    
            child.on('exit', function (code, signal) {
                console.log('Child process exited with code:', code, 'and signal:', signal);
                throw Error('unexpected indexer termination');
            });
    
            child.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });
    
            child.stderr.on('data', (data) => {
                console.error(data.toString('utf8'));
            });
        } else {
            console.log('skipStart is true, skipping the function');
        }
    
        console.log('Running the transport with subscribers:', subscribers);
        this.transport.run(subscribers);
    }

    stop() {
        // TODO: stop indexer
    }

    GenerateIndexerConfig(fullPath: string) {
        const dataFolder = this.getDataFolder(fullPath);

        const fusionConfigPath = path.join(process.cwd(), 'fusion.json');
        if (!fs.existsSync(fusionConfigPath)) {
            throw Error(`File ${fusionConfigPath} does not exist`);
        }

        const config = JSON.parse(fs.readFileSync(fusionConfigPath, 'utf8'))

        const fusionConfig = stringify({ ...config, install_path: undefined });
        fs.writeFileSync(dataFolder + '/config.yaml', fusionConfig);
    }

    protected getDataFolder(fullPath: string) {
        return fullPath + '/data';
    }

    protected makeAddressOrHash(value: string) : AddressOrCodeHash {
        if (this.validateAddress(value)) {
            return { address: value };
        } else if (this.isHex(value)) {
            return { code_hash: value}
        } else {
            throw Error('parameter is not contract Address or code hash')
        }
    }

    protected validateAddress(walletAddress: string) {
        const addressArray = walletAddress.split(':');
        if (addressArray.length != 2)
            return false;

        return this.isHex(addressArray[0]) && this.isHex(addressArray[1]);
    }

    protected isHex(value: string) {
        return value.match(/^[0-9a-fA-F]+$/);
    }

    protected isText(data: unknown) : data is string {
        return typeof data === 'string';
    };

    protected http2Url() : string {
        return 'http://' + this.http2RawURL();
    }

    protected http2RawURL() : string {
        return '127.0.0.1:3000';
    }
}
