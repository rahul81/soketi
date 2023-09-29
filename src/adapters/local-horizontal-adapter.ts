import { Server } from "../server";
import { AdapterInterface } from "./adapter-interface";
import { HorizontalAdapter } from "./horizontal-adapter";

export class LocalHorizontalAdapter extends HorizontalAdapter {
    /**
     * The channel to broadcast the information.
     */
    protected channel = 'local-horizontal-adapter';

    /**
     * Initialize the adapter.
     */
    constructor(server: Server) {
        super(server);
    }

    /**
     * Initialize the adapter.
     */
    async init(): Promise<AdapterInterface> {
        await super.init();
        return this;
    }

    /**
     * Broadcast data to a given channel.
     */
    protected broadcastToChannel(channel: string, data: string): void {
        // this.pubClient.publish(channel, data);
        console.log("SENDING VIA LOCAL HORIZONTAL ADAPTER");
        
    }

    protected getNumSub(): Promise<number> {
        return Promise.resolve(1);
    }
}