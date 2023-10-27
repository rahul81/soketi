import express, { Request, Response } from "express";
import { Redis } from "ioredis";
import { Server } from "../../server";
import KeyManagerService from "../../services/key-manager";

export default class Controller {
    app: express.Router;
    keyManager: KeyManagerService;
    constructor(private redis: Redis, private db: Server) {
        this.keyManager = new KeyManagerService(this.redis, this.db);
        this.app = express.Router();
        console.log("Controller created");
    }

    register(app: express.Application) {
        console.log("Registering route");
        console.log("Registering routes 1");
        this.getRoutes().map((route) => {
            const { method, route: path, handler } = route;
            this.app[method](path, (req, res) => {
                try {
                    handler.bind(this).call(this, req, res);
                } catch (e) {
                    console.log("Error in route", e);
                    res.status(500).send("Error");
                }
            });
        });
        app.use("/api", this.app);
    }

    getRoutes(): {
        route: string;
        method: "get" | "post" | "put" | "delete";
        handler: Function;
    }[] {
        return [
            {
                method: "get",
                route: "/health-check",
                handler: this.healthCheckRoute,
            },
            {
                method: "post",
                route: "/generate-keys",
                handler: this.generateKeysRoute,
            },
            {
                method: "post",
                route: "/flows/key",
                handler: this.addKeyRoute.bind(this),
            },
            {
                method: "delete",
                route: "/flows/key",
                handler: this.deleteKeyRoute.bind(this),
            },
        ];
    }

    async healthCheckRoute(req: Request, res: Response) {
        res.send("Queue Health is running");
    }

    async addKeyRoute(req: Request, res: Response) {
        const { key, app_id } = req.body;
        const { token } = req.headers;
        if (!token) {
            return res.status(403).send("Unauthorized: No token provided");
        }

        if (token !== process.env.API_KEY) {
            return res.status(403).send("Unauthorized: Invalid token");
        }

        if (!key) {
            console.log("No key provided");
            return res.status(400).send("No key provided");
        }

        if (!app_id) {
            console.log("No app_id provided");
            return res.status(400).send("No app_id provided");
        }

        try {
            const out = await this.keyManager.addFlowKey(app_id, key);
            if (!out) {
                console.log(out);
                return res.status(400).send("Error adding key");
            }
        } catch (e) {
            console.log(e);
            return res.status(400).send("Error adding key");
        }

        return res.status(200).send("Key added");
    }

    async deleteKeyRoute(req: Request, res: Response) {
        const { token } = req.headers;
        if (!token) {
            return res.status(403).send("Unauthorized: No token provided");
        }

        if (token !== process.env.API_KEY) {
            return res.status(403).send("Unauthorized: Invalid token");
        }

        const { key, app_id } = req.body;
        if (!key) {
            console.log("No key provided");
            return res.status(400).send("No key provided");
        }

        if (!app_id) {
            console.log("No app_id provided");
            return res.status(400).send("No app_id provided");
        }

        try {
            const out = await this.keyManager.deleteKey(app_id, key);
            if (!out) {
                console.log(out);
                return res.status(400).send("Error deleting key");
            }
        } catch (e) {
            console.log(e);
            return res.status(400).send("Error deleting key");
        }

        return res.status(200).send("Key deleted");
    }

    async generateKeysRoute(req: Request, res: Response) {
        try {
            const flows = await this.keyManager.generateFlowKeys();
        } catch (e) {
            return res.status(500).send("Error generating flows");
        }
        return res.send("Flows generated");
    }
}
