import { Config, Transport, TransportMock } from './';

export class TestIndexer {
    protected readonly config: Config;
    protected readonly transport: Transport;

    constructor(config: Config) {
        this.config = config;
        this.transport = new TransportMock(this.config);
    }

    run(subscribers: any) {
        this.transport.run(subscribers);
    }

    stop() {}
}
