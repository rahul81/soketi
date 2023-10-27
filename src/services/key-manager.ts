import Redis from "ioredis";
import { Server } from "../server";

export default class KeyManagerService {
    constructor(private redis: Redis, private server: Server) {
        console.log("KeyManagerService created");
    }

    async getInstance() {
        return this;
    }
    /**
     * Generates the keys for the flows of an app
     * Saves the keys in redis in key "queue_processor:app_id:${appId}:channels"
     * Value is a string with all the channels separated by "|"
     * the final value is something like "channel1|channel2|channel3"
     */
    async generateFlowKeys() {
        console.log("Generating flow keys");
        //get all flows_names for the app
        const exists = await this.redis.get("queue_processor:flows_generated");

        if (exists !== null) {
            const existTs = parseInt(exists);
            console.log("Flows already generated at time stamp", existTs);
            return true;
        }

        //@ts-ignore
        const flows = (await this.getFlows()).rows;
        if (flows.length === 0) {
            return true;
        }

        const pipe = await this.redis.multi({
            pipeline: true,
        });

        const outs = await Promise.all(
            flows.map(async (flow) => {
                return await pipe.sadd(
                    `queue_processor:${flow.appId}`,
                    ...flow.channels
                );
            })
        );

        await pipe.exec();
        this.redis.set("queue_processor:flows_generated", Date.now());
        return true;
    }

    async getFlows(): Promise<{ appId: string; channels: string[] }[]> {
        return await this.server.appManager.generateFlowKeys();
    }

    async addFlowKey(appId: string, key: string) {
        const out2 = await this.redis.sadd(`queue_processor:${appId}`, key);
        return true;
    }

    async deleteKey(appId: string, key: string) {
        const out = await this.redis.srem(`queue_processor:${appId}`, key);
        return true;
    }
}
