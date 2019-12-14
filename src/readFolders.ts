import dirTree = require("directory-tree");
import { writeFileSync } from 'fs';
import { MetalBand } from './bandClass';
import { flatten } from 'lodash';

export const songsFormats = ['mp3', 'wma', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

export const readFolders = (folder: string): MetalFolder => {

    const folderStructureFile = 'outputs/folderStructure.json'
    const filteredTree = dirTree(folder, {
        extensions: /\.(mp3|wma|MP3|WMA|WAV|wav|OGG|ogg|FLAC|flac|M4A|m4a|AAC|aac)$/
    });

    const jsonString = JSON.stringify(filteredTree);
    if (jsonString) {
        writeFileSync(folderStructureFile, jsonString);
        console.log(folderStructureFile + ' was written to disk!')
        return Convert.toMetalFolder(jsonString);
    }
    return null;
}

export const extractMetalBandsFromMetalFolder = (folder: MetalFolder, genreFoldersBelow: boolean = false): MetalBand[] => {

    if (genreFoldersBelow) {
        const genreFolders = folder.children;
        const metalBandFolders: MetalBand[] = flatten(genreFolders.map(genreFolder => genreFolder.children.map(bandFolder => new MetalBand(bandFolder))));
        return metalBandFolders;
    } else {
        if (!folder) {
            console.log('[Error] Folder not found! Are you sure this is the right address?')
            return null;
        }
        return folder.children.map(bandFolder => new MetalBand(bandFolder));
    }

}

export interface MetalFolder {
    path?: string;
    name?: string;
    children?: Child[];
    size?: number;
    type?: Type;
}

export interface Child {
    path?: string;
    name?: string;
    children?: Child[];
    size?: number;
    type?: Type;
    extension?: Extension;
}

export enum Extension {
    Mp3 = ".mp3",
    WMA = ".wma",
}

export enum Type {
    Directory = "directory",
    File = "file",
}

// Converts JSON strings to/from your types
export class Convert {
    public static toMetalFolder(json: string): MetalFolder {
        return JSON.parse(json);
    }

    public static metalFolderToJson(value: MetalFolder): string {
        return JSON.stringify(value);
    }
}
