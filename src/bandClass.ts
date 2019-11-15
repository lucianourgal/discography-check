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
        let unfilteredAlbuns = bandData.children.map((album:Child) => new MetalAlbum(album, this.name))

        // Gets all thir level folders
        const thirdLevelFoldersMatrix = bandData.children.map(secondLevel => {
            if(secondLevel === 'file') {
                return null;
            } else return secondLevel.children;
        });
        const thirdLevelFolders = flatten(thirdLevelFoldersMatrix);
        const thirdLevelFoldersFiltered = thirdLevelFolders.filter(el => !!el);
        const thirdLevelAlbums = thirdLevelFoldersFiltered.map((album:Child) => new MetalAlbum(album, this.name))

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

    public getBandAlbumList() {
        return { bandName: this.name, albumNames: this.albuns.map(album => album.getFilteredAlbumName()) }
    }

    public getBandAlbumErrors() {
        return this.albuns.map(album => album.getError());
    }
 
}

class MetalAlbum {

    private isAlbum: boolean;
    private files: Child[];
    private songs: Child[];
    private path: string;
    private bandName: string;
    private name: string;
    private error: string;

    constructor(folder: MetalFolder, bandName: string) {

        this.path = folder.path;
        this.name = folder.name;
        this.path = folder.path;
        this.bandName = bandName;
        this.error = '';

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

    public getFilteredAlbumName() {
        return this.filterAlbumName(this.name);
    }

    public getError() {
        return this.error;
    }


    private filterAlbumName(str: string): string {

        // remove ()
        let filtered = this.removeAnnotation(str, '(', ')');
        // remove []
        filtered = this.removeAnnotation(filtered, '[', ']');
        // remove Year 
        if(filtered.includes('-')) {
            filtered = filtered.split('-')[1];
        }

        return filtered.trim();
    }

    private removeAnnotation(str: string, annStart: string, annEnd: string) {
        if(str.includes(annStart) && str.includes(annEnd)) {
            let error = '';
            const splitStart = str.split(annStart);
            if(splitStart.length !== 2) {
                this.error = 'Alert: "' + str + '" has too much "'+annStart+'"  ('+this.bandName+')\n'
                console.log(this.error);
                return str;
            }
            const splitEnd = splitStart[1].split(annEnd);
            if(splitEnd.length !== 2) {
                this.error = error + 'Alert: "' + str + '" has too much "'+annEnd+'" ('+this.bandName+')\n'
                console.log(this.error);
                return str;
            }
            return splitStart[0] + splitEnd[1];
        } else {
            return str;
        }
    }

}

const getSongsFromChildArray = (arr: Child[]) => {
    if(!arr) return [];
    const valids = arr.filter(el => el && el.extension)
    return valids.filter(el => 
        songsFormats.includes(el.extension.toLowerCase().replace('.','')))
}