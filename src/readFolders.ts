import dirTree = require("directory-tree");
import { writeFileSync } from 'fs';
import { MetalBand } from './bandClass';
import { flatten } from 'lodash';

export const songsFormats = ['mp3', 'wma', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

/**
 * @description Reads folder structure to create a .json file and MetalFolder object
 * @param folder root folder address
 * @returns MetalFolder object
 */
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

/**
 * @description Uses a MetalFolder object to create a array of MetalBand objects
 * @param folderObj folder structure object
 * @param genreFoldersBelow Set this as true if you have a structure like: MainFolder -> GenreFolders -> BandFolders
 * @returns MetalBand objects array
 */
export const extractMetalBandsFromMetalFolder = (folderObj: MetalFolder, genreFoldersBelow: boolean = false): MetalBand[] => {

    if (genreFoldersBelow) {
        const genreFolders = folderObj.children;
        const metalBandFolders: MetalBand[] = flatten(genreFolders.map(genreFolder => genreFolder.children.map(bandFolder => new MetalBand(bandFolder))));
        return metalBandFolders;
    } else {
        if (!folderObj) {
            console.log('[Error] Folder not found! Are you sure this is the right address?')
            return null;
        }
        return folderObj.children.map(bandFolder => new MetalBand(bandFolder));
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

export class Convert {
    /**
     * @description Turns json string into MetalFolder object
     * @param json string
     */
    public static toMetalFolder(json: string): MetalFolder {
        return JSON.parse(json);
    }

    /**
     * @description Turns MetalFolder object into json string
     * @param object MetalFolder object
     */
    public static metalFolderToJson(object: MetalFolder): string {
        return JSON.stringify(object);
    }
}
