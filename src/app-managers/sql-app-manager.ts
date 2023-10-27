import { Knex, knex } from "knex";
import { Flow } from "../flow-engine";
import { Log } from "../log";
import { App } from "./../app";
import { Server } from "./../server";
import { BaseAppManager } from "./base-app-manager";

export abstract class SqlAppManager extends BaseAppManager {
    /**
     * The Knex connection.
     *
     * @type {Knex}
     */
    protected connection: Knex;

    /**
     * Create a new app manager instance.
     */
    constructor(protected server: Server) {
        super();

        let knexConfig = {
            client: this.knexClientName(),
            connection: this.knexConnectionDetails(),
            version: this.knexVersion(),
        };
        console.log("Knex config >> ", knexConfig);

        if (this.supportsPooling() && server.options.databasePooling.enabled) {
            knexConfig = {
                ...knexConfig,
                ...{
                    pool: {
                        min: server.options.databasePooling.min,
                        max: server.options.databasePooling.max,
                    },
                },
            };
        }

        this.connection = knex(knexConfig);
    }

    /**
     * Find an app by given ID.
     */
    findById(id: string): Promise<App | null> {
        return this.selectById(id).then((apps) => {
            if (apps.length === 0) {
                if (this.server.options.debug) {
                    Log.error(`App ID not found: ${id}`);
                }

                return null;
            }

            return new App(apps[0] || apps, this.server);
        });
    }

    /**
     * Find an app by given key.
     */
    findByKey(key: string): Promise<App | null> {
        return this.selectByKey(key).then((apps) => {
            if (apps.length === 0) {
                if (this.server.options.debug) {
                    Log.error(`App key not found: ${key}`);
                }

                return null;
            }

            return new App(apps[0] || apps, this.server);
        });
    }

    /**
     * Make a Knex selection for the app ID.
     */
    protected selectById(id: string): Promise<App[]> {
        return this.connection<App>(this.appsTableName())
            .where("id", id)
            .whereNull("deleted_at")
            .select("*");
    }

    /**
     * Make a Knex selection for the app key.
     */
    protected selectByKey(key: string): Promise<App[]> {
        return this.connection<App>(this.appsTableName())
            .where("key", key)
            .whereNull("deleted_at")
            .select("*");
    }

    /**
     * Get flows for the given app ID.
     */
    selectFlowsByAppId(appId: string, channel: string): Promise<any[]> {
        return this.connection<Flow>("flows")
            .where("appId", appId)
            .andWhere("active", true)
            .andWhere("channel", channel)
            .whereNull("deleted_at")
            .select("*");
    }

    async generateFlowKeys() {
        return await this.connection.raw(`
            SELECT "appId",
                ARRAY_AGG(CHANNEL) CHANNELS
            FROM flows
            GROUP BY "appId";
        `);
    }

    /**
     * Get the client name to be used by Knex.
     */
    protected abstract knexClientName(): string;

    /**
     * Get the object connection details for Knex.
     */
    protected abstract knexConnectionDetails(): { [key: string]: any };

    /**
     * Get the connection version for Knex.
     * For MySQL can be 5.7 or 8.0, etc.
     */
    protected abstract knexVersion(): string;

    /**
     * Wether the manager supports pooling. This introduces
     * additional settings for connection pooling.
     */
    protected abstract supportsPooling(): boolean;

    /**
     * Get the table name where the apps are stored.
     */
    protected abstract appsTableName(): string;
}
