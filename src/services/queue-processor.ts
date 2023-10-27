import { Job } from "bull";
import Redis from "ioredis";
import { AppManager } from "../app-managers";
import { FlowExecutor } from "../flow-engine";
import Message from "../flow-engine/types";
import { Server } from "../server";
import QueueWrapper from "./queue-wrapper";

export class QueueProcessor {
    db: AppManager;
    processedQueue: QueueWrapper;
    flowExecutor: FlowExecutor;
    server: Server;
    redis;

    constructor(server: Server, redis: Redis) {
        this.server = server;
        this.processedQueue = new QueueWrapper(server.emitter);
        this.flowExecutor = new FlowExecutor(
            this.processedQueue,
            server.appManager as AppManager,
            redis
        );
    }

    async onProcessMessage(job: Message) {
        const data = job;
        console.log("Processing message", data);

        let out = await this.flowExecutor.execute(job);
        console.log("Flow executed", out);
        return out;
    }

    async onJobCompleted(job: Job) {
        console.log(`Job completed`);
    }

    async onJobFailed(job: Job, err: Error) {
        console.error(`Job failed: ${job.data}, Error: ${err.message}`);
    }
}
