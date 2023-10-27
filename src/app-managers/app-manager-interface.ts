import { App } from "../app";
import { Flow } from "../flow-engine";

export interface AppManagerInterface {
    /**
     * The application manager driver.
     */
    driver?: AppManagerInterface;

    /**
     * Find an app by given ID.
     */
    findById(id: string): Promise<App | null>;

    /**
     * Find an app by given key.
     */
    findByKey(key: string): Promise<App | null>;

    /**
     * Get the app secret by ID.
     */
    getAppSecret(id: string): Promise<string | null>;

    /**
     * Get the flows for the given app ID.
     */
    selectFlowsByAppId(id: string, channel: string): Promise<Flow[]>;

    generateFlowKeys();
}
