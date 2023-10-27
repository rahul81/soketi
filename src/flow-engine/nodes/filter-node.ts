import mingo, { Query } from "mingo";
import Context from "../context";
import { BaseNode, INode } from "./base-node";

export class FilterNode extends BaseNode implements INode {
    data: any;
    type: string;
    evalEngine: Query;

    constructor(type: string, data: any) {
        super(type, data);
        this.type = "filter";
        this.evalEngine = new mingo.Query(data.filter);
    }

    async init() {
        console.log("Filter node ");
    }

    async execute(context: Context): Promise<any> {
        let data = await super.execute(context);

        if (this.evalEngine.test(data)) {
            return Promise.resolve({
                ...data,
            });
        } else {
            this.setNextNode(undefined);
            return Promise.resolve({
                data: {},
                message: "",
            });
        }
    }
}
