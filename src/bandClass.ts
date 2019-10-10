import { Child, MetalFolder, songsFormats } from './readFolders';
import { flatten } from 'lodash';


export class MetalBand {
    
    private albuns: MetalAlbum[];
    private name: string;
    private genres: {name: string, momment: 'early' | 'mid' | 'late'}[];
    private isBand: boolean;
    private path: string;
    private songsInRootFolder: Child[];
    
    constructor(bandData: Child) {
        this.name = bandData.name;
        this.albuns = [];
        this.genres = [];
        this.path = bandData.path;
        this.songsInRootFolder = getSongsFromChildArray(bandData.children);

        if(bandData.type === 'file') {
            this.isBand = false;
            return;
        } else {
            this.isBand = true;
        }

        // Treats second level folders as albums
        let unfilteredAlbuns = bandData.children.map(album => new MetalAlbum(album))

        // Gets all thir level folders
        const thirdLevelFoldersMatrix = bandData.children.map(secondLevel => {
            if(secondLevel === 'file') {
                return null;
            } else return secondLevel.children;
        });
        const thirdLevelFolders = flatten(thirdLevelFoldersMatrix);
        const thirdLevelFoldersFiltered = thirdLevelFolders.filter(el => !!el);
        const thirdLevelAlbums = thirdLevelFoldersFiltered.map(album => new MetalAlbum(album))

        unfilteredAlbuns = [...unfilteredAlbuns, ...thirdLevelAlbums]
        this.albuns = unfilteredAlbuns.filter(el => el.getIsAlbum())
    }

    public getIsBand() {
        return this.isBand;
    }
    public getName() {
        return this.name;
    }

    public getAlbunsCount() {
        return this.albuns.length;
    }
    public songsInRootFolderCount() {
        return this.songsInRootFolder.length;
    }

    public getReport() {
        return this.name + ': ' + this.getAlbunsCount() + ' albums, ' + 
        this.songsInRootFolderCount() + ' songs in root folder.'
    }
 
}

class MetalAlbum {

    private isAlbum: boolean;
    private files: Child[];
    private songs: Child[];
    private path: string;

    constructor(folder: MetalFolder) {

        this.path = folder.path;

        if(folder.type === 'file') {
            this.isAlbum = false;
            return;
        } else {
            this.isAlbum = true;
        }

        this.files = folder.children.filter(el => el.type === 'file')
        this.songs = getSongsFromChildArray(this.files)
    }

    public getIsAlbum() {
        return this.isAlbum;
    }
}

const getSongsFromChildArray = (arr: Child[]) => {
    if(!arr) return [];
    const valids = arr.filter(el => el && el.extension)
    return valids.filter(el => 
        songsFormats.includes(el.extension.toLowerCase().replace('.','')))
}