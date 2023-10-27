import { Queue } from "bull";
import { EventEmitter } from "stream";

export default class QueueWrapper {
    eventEmitter: EventEmitter;
    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    addQueue(queue: Queue) {
        this.eventEmitter.emit("processed", queue);
    }

    getQueue(number: number) {
        return this.eventEmitter;
    }

    getQueues() {
        return this.eventEmitter;
    }

    getQueueLength() {
        return 1;
    }

    async distributeMessageToQueues(data: any) {
        this.eventEmitter.emit("processed", data);
    }
}
