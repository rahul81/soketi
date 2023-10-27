import IsolatedVM, { Isolate, Context as Jail } from "isolated-vm";
import Context from "../context";
import { BaseNode, INode } from "./base-node";

export class TransformNode extends BaseNode implements INode {
    data: any;
    type: string;
    isolate: Isolate;
    jail?: Jail = undefined;

    constructor(type: string, data: any) {
        super(type, data);
        this.type = "transform";
        this.isolate = new IsolatedVM.Isolate({ memoryLimit: 128 });
    }

    async init(): Promise<void> {
        console.log("TransformNode init");
        this.jail = await this.isolate.createContext();
    }

    async execute(context: Context): Promise<any> {
        let data = await super.execute(context);
        const { transformer } = this.data;
        if (!transformer || transformer === "") {
            return Promise.resolve({
                data: data,
                message: "TransformNode executed",
            });
        }

        let result = await this.executeTransform(transformer, [data]);

        if (typeof result === "object") {
            return Promise.resolve({
                ...result,
            });
        }

        return Promise.resolve({
            data: result,
        });
    }

    async executeTransform(transformer: string, args: any) {
        try {
            const module = await this.isolate.compileModule(transformer, {
                filename: "transformer.mjs",
            });

            //@ts-ignore
            await module.instantiate(this.jail as Jail, () => {});
            await module.evaluate({ timeout: 1000, promise: true });

            let func = await module.namespace.get("default");
            let result = await func.apply(undefined, args);

            console.log("Transform result", result);
            return result;
        } catch (e) {
            this.isolate.dispose();
            console.log("Error executing transform", e);
        }
    }
}
