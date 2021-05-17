declare class JSONDatabase<DataModel> {
    constructor(): void;
    appendDB(data: DataModel): void;
    modifyDB(index: number, data: DataModel): void;
    writeDB(data: DataModel[]): void;
    readDB(): DataModel[];
};

declare interface TaggedSong {
    path: string;
    tags: string[];
}

declare interface IPDatabaseModel {
    ip: string;
    taggedSongs: TaggedSong[]; // one tagged song is a PATH not a URL!
};

declare interface SongTag {
    tagName: string;
    votes: number;
}

declare interface TagDatabaseModel {
    path: string; // this is a PATH not a URL!
    tags: SongTag[];
}

declare class IPDatabase extends JSONDatabase<IPDatabaseModel> {
    constructor(dbPath: string): void;
    _validateIPAddress(ipAddr: string): boolean;
    searchByIP(ipAddr: string): IPDatabaseModel;
    modifyByIP(ipAddr: string, data: IPDatabaseModel): void;
    addTaggedSongForIP(ipAddr: string, taggedSongPath: string, tags: string[]): void;
}

declare class TagDatabase extends JSONDatabase<TagDatabaseModel> {
    constructor(dbPath: string): void;
    searchByPath(filePath: string): TagDatabaseModel;
    tagExists(filePath: string, tagName: string): void;
    modifyByPath(filePath: string, data: TagDatabaseModel): void;
    addTagToSong(filePath: string, tagNames: string[]): void;
    incrementTagOnSong(filePath: string, tagName: string): void;
    decrementTagOnSong(filePath: string, tagName: string): void;
}

export { JSONDatabase, IPDatabase, TagDatabase };