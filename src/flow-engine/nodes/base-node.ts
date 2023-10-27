import Context from "../context";

export interface INode {
    data: any;
    type: string;
    init(): Promise<void>;
    execute(context: Context): Promise<any>;
    getNextNode(): Promise<INode | undefined>;
    setNextNode(node: INode): void;
}

export class BaseNode implements INode {
    nextNode?: INode = undefined;
    data: any;
    type: string;

    constructor(type: string, data: any) {
        this.type = type;
        this.data = data;
    }

    async getNextNode() {
        return this.nextNode;
    }

    async setNextNode(node: INode | undefined) {
        this.nextNode = node;
    }

    async init() {
        console.log("BaseNode init");
    }

    async execute(context: Context) {
        console.log("Base node ctx >> ", context);
        let { data } = context.get("data");
        try {
            data = JSON.parse(data);
        } catch (e) {}

        return data;
    }
}
