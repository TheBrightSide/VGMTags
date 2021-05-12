declare interface PathSong {
    title: string;
    path: string;
};

declare interface PathAlbum {
    title: string;
    songs: PathSong[];
    thumbnail: string | null;
    path: string;
};

export async function readTags(fileName: string): Promise<TagType>;
export function getMusicFolders(): string[];
export async function getMusicFilenames(folderName?: string): Promise<PathAlbum[]>;
export async function getCachedMusicFilenames(folderName?: string): Promise<PathAlbum[]>;
export function random(min: number, max: number): number;
export function URLToFilePath(url: string): string;
export function filePathToFolderTreeURL(filepath: string): string;