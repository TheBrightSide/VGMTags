import { TagType } from '@types/jsmediatags/types';

interface PathSong {
    title: string;
    path: string;
};

interface PathAlbum {
    title: string;
    songs: Song[];
    thumbnail: string;
    path: string;
};

export async function readTags(fileName: string): Promise<TagType>;
export async function getMusicFolders(): string[];
export async function getMusicFilenames(folderName: string): Promise<PathAlbum[]>;
export async function getCachedMusicFilenames(folderName: string): Promise<PathAlbum[]>;