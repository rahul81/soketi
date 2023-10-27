import Redis from "ioredis";
import { AppManager } from "../app-managers";
import QueueWrapper from "../services/queue-wrapper";
import Context from "./context";
import { BaseNode, INode } from "./nodes/base-node";
import { FilterNode } from "./nodes/filter-node";
import { TransformNode } from "./nodes/transform-node";
import Message from "./types";

export interface Flow {
    id: string;
    appId: string;
    channel: string;
    flowSpec: {
        steps: {
            type: string;
            data: any;
        }[];
    };
    active: boolean;
}

export class FlowExecutor {
    constructor(
        private processedQueue: QueueWrapper,
        private db: AppManager,
        private redis: Redis
    ) {}

    async createFlow(flow) {
        // create a tree from the flow template
        const flowTree = await this.createTree(
            flow.flow as {
                steps: {
                    type: string;
                    data: any;
                }[];
            }
        );
        return flowTree;
    }

    async createTree(flowTemplate: {
        steps: {
            type: string;
            data: any;
        }[];
    }): Promise<INode | null> {
        let steps = flowTemplate.steps;
        if (!steps || steps.length === 0) {
            return null;
        }

        let rootNodeData = steps.shift();
        if (!rootNodeData) {
            return null;
        }

        let rootNode = await this.nodeFactory(
            rootNodeData.type,
            rootNodeData.data
        );
        let currentNode = rootNode;

        while (currentNode) {
            let nextNodeData = steps.shift();
            if (!nextNodeData) {
                break;
            }

            let nextNode = await this.nodeFactory(
                nextNodeData.type,
                nextNodeData.data
            );
            currentNode.setNextNode(nextNode);
            currentNode = nextNode;
        }

        return rootNode;
    }

    async nodeFactory(type: string, data: any): Promise<INode> {
        switch (type) {
            case "filter":
                return new FilterNode(type, data);
            case "transform":
                return new TransformNode(type, data);
            default:
                return new BaseNode(type, data);
        }
    }

    async execute(job: Message) {
        const { metaData, data } = job;

        const context = new Context(
            {
                metaData,
                data,
            },
            this.processedQueue
        );

        console.log("Executing flow", metaData);
        let flow = null;
        const client = this.redis;
        if (client) {
            let out = await client.get(
                `queue_processor:flow:${metaData.appId}:${metaData.channel}`
            );
            if (out) {
                try {
                    flow = JSON.parse(out);
                } catch (e) {}
            }
        }

        if (!flow) {
            flow = await this.db.selectFlowsByAppId(
                metaData.appId,
                metaData.channel
            );

            if (flow.length === 0) {
                console.log("No flow found");
                await this.processedQueue.distributeMessageToQueues(job);
                return {
                    metaData,
                    data,
                };
            }

            if (client) {
                await client.set(
                    `queue_processor:flow:${metaData.appId}:${metaData.channel}`,
                    JSON.stringify(flow),
                    "EX",
                    60 * 60 * 24
                );
            }
        }

        const root = await this.createFlow(flow[0]);
        if (!root) {
            return;
        }

        await root.init();
        context.setNextNode(root);

        while (context.nextNode) {
            const nextNode = await context.getNextNode();
            if (!nextNode) {
                break;
            }

            await nextNode.init();
            let out = await nextNode.execute(context);
            const nn = await nextNode.getNextNode();
            context.setNextNode(nn);
            if (nextNode.type === "send-to-channel") {
                console.log("context", context.get("data"));
                const finalData = {
                    metaData,
                    data: {
                        ...context.get("data"),
                        data: {
                            ...out,
                        },
                    },
                };

                context.broadcastMessageToQueues(finalData);
            }
            context.set("data", {
                ...context.get("data"),
                data: {
                    ...out,
                },
            });
        }

        return {
            metaData,
            data: context.get("data"),
        };
    }
}
