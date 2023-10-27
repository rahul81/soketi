import QueueWrapper from "../services/queue-wrapper";
import { INode } from "./nodes/base-node";

export default class Context {
    private _data: Record<string, any> = {};
    nextNode?: INode = undefined;
    nextNodeData?: Record<string, any> = undefined;

    private processedQueue: QueueWrapper;

    manual = null;

    constructor(data: Record<string, any> = {}, processedQueue: QueueWrapper) {
        this._data = data;
        this.processedQueue = processedQueue;
    }

    set(key: string, value: any) {
        this._data[key] = value;
    }

    get(key: string) {
        return this._data[key];
    }

    getNextNode(): Promise<INode> {
        return Promise.resolve(this.nextNode as INode);
    }

    setNextNode(node: INode | undefined, manual = null) {
        this.nextNode = node;
        // if manual is null, it means that the next node is set by the engine
        // if manual is true, it means that the next node is set by the user
        // if manual is false, it means that the next node is set by the engine
        this.manual = manual;
        return this.nextNode;
    }

    broadcastMessageToQueues(data: any) {
        this.processedQueue.distributeMessageToQueues(data);
    }
}
