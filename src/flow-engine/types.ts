export interface MetaData {
    appId: string;
    channel: string;
    event: string;
}

export interface MessageData {
    event: string;
    channel: string;
    data: any;
}

export default interface Message {
    metaData: MetaData;
    data: any;
}
