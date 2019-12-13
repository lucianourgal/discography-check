import { Child, MetalFolder, songsFormats } from './readFolders';
import { flatten } from 'lodash';
import { metallumBandData, metallumDiscographyByBandName } from './metallumRequest';

export class MetalBand {

    private albuns: MetalAlbum[];
    private name: string;
    private genres: { name: string, momment: 'early' | 'mid' | 'late' }[];
    private isBand: boolean;
    private path: string;
    private songsInRootFolder: Child[];

    private metallumData: metallumBandData;

    constructor(bandData: Child) {
        this.name = bandData.name;
        this.albuns = [];
        this.genres = [];
        this.path = bandData.path;
        this.songsInRootFolder = getSongsFromChildArray(bandData.children);

        if (bandData.type === 'file') {
            this.isBand = false;
            return;
        } else {
            this.isBand = true;
        }

        // Treats second level folders as albums
        let unfilteredAlbuns = bandData.children.map((album: Child) => new MetalAlbum(album, this.name, this.name))

        // Gets all thir level folders
        const thirdLevelFolders: { albumFolder: Child, parentName: string }[] = flatten(bandData.children.map(secondLevel => {
            if (secondLevel === 'file' || !secondLevel.children) {
                return null;
            } else return secondLevel.children.map(cur => { return { albumFolder: cur, parentName: secondLevel.name } });
        }));

        const thirdLevelFoldersFiltered = thirdLevelFolders.filter(el => !!el);
        const thirdLevelAlbums = thirdLevelFoldersFiltered.map((obj: { albumFolder: Child, parentName: string }) =>
            new MetalAlbum(obj.albumFolder, this.name, obj.parentName))

        unfilteredAlbuns = [...unfilteredAlbuns, ...thirdLevelAlbums]
        this.albuns = unfilteredAlbuns.filter(el => el.getIsAlbum())
    }

    public async searchMetallumData() {

        const possibleMetallumData: metallumBandData[] = await metallumDiscographyByBandName(this.name);
          
        if(!possibleMetallumData) {
            console.log('[Error] Nothing was found related to band '+ this.name + '.');
            return;
        } 

        let closestMatch: metallumBandData;
        let closestMatchCount = 0;
        const folderAlbumNames = this.getBandAlbumList().albumNames;

        for(let x=0;x<possibleMetallumData.length;x++) { // check bands possibilities 
            let count = 0;
            const mAlb = possibleMetallumData[x].albums && possibleMetallumData[x].albums.map(album => album.name);
            for(let a=0;a<mAlb.length;a++) { // metallum album by metallum album
                if(folderAlbumNames.includes(mAlb[a])) {
                    count++;
                }
            }
            // check if this is the closest match
            if(count > closestMatchCount) {
                closestMatchCount = count;
                closestMatch = possibleMetallumData[x];
            }
        }

        if(closestMatch) console.log('[Ok] Band ' + this.name + ' has a match! ' + closestMatchCount + ' album matchs.')
        this.metallumData = closestMatch;
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

    public getSongsInChildsCount() {
        const countsPerAlbum = this.albuns.map(album => album.getSongsCount());
        const sumReducer = (total: number, newValue: number) => total + newValue;

        return countsPerAlbum.reduce(sumReducer, 0);
    }

    public songsInRootFolderCount() {
        return this.songsInRootFolder.length;
    }

    public getReport() {
        const songsCount = this.songsInRootFolderCount();
        const albunsCount = this.getAlbunsCount();

        return this.name + ': ' +
            (albunsCount ? albunsCount + ' album' + (albunsCount > 1 ? 's' : '') + '; ' : '') +
            (songsCount ? songsCount + ' songs in root folder.' : '') +
            ((songsCount + albunsCount) === 0 ? 'Nothing found.' : '');
    }

    public getBandAlbumList() {
        return { bandName: this.name, albumNames: this.albuns.map(album => album.getFilteredAlbumName()) }
    }

    public getBandAlbumErrors() {
        const errors = this.albuns.map(album => album.getError())
        return (errors && errors.length) ? errors.filter(el => !!el).join(',') : '';
    }

}

class MetalAlbum {

    private isAlbum: boolean;
    private files: Child[];
    private songs: Child[];
    private path: string;
    private bandName: string;
    private parentFolderName: string;
    private name: string;
    private error: string;

    constructor(folder: MetalFolder, bandName: string, parentFolderName: string) {

        this.path = folder.path;
        this.name = folder.name;
        this.bandName = bandName;
        this.parentFolderName = parentFolderName;
        this.error = '';

        this.files = folder.children ?
            folder.children.filter(el => el.type === 'file') : [];
        this.songs = getSongsFromChildArray(this.files);

        if (folder.type === 'file') {
            this.isAlbum = false;
            return;
        } else {
            this.isAlbum = this.songs.length > 0;
        }

    }

    public getSongsCount() {
        return this.songs.length;
    }

    public getIsAlbum() {
        return this.isAlbum;
    }

    public getFilteredAlbumName() {

        const nameStandart = this.name.replace(' ', '').replace('2', '1').replace('3', '1').toUpperCase();
        const isCDFolderInsideAlbumFolder = nameStandart.startsWith('CD1')

        return isCDFolderInsideAlbumFolder ? this.filterAlbumName(this.parentFolderName)
            : this.filterAlbumName(this.name);
    }

    public getError() {
        return this.error;
    }


    private filterAlbumName(str: string): string {

        // remove ()
        let filtered = this.removeAnnotation(str, '(', ')');
        // remove []
        filtered = this.removeAnnotation(filtered, '[', ']');
        // Ignores anything before - symbol 
        if (filtered.includes('-') && filtered.split('-')[0].length > 2) {
            filtered = filtered.split('-')[1];
        }

        return filtered.replace('_', ' ').trim();
    }


    private removeAnnotation(str: string, annStart: string, annEnd: string) {
        if (str.includes(annStart) && str.includes(annEnd)) {
            let error = '';
            const splitStart = str.split(annStart);
            if (splitStart.length !== 2) {
                this.error = 'Alert: "' + str + '" has too much "' + annStart + '"  (' + this.bandName + ') returning "' + splitStart[0] + '"\n'
                console.log(this.error);
                return splitStart[0];
            }
            const splitEnd = splitStart[1].split(annEnd);
            if (splitEnd.length !== 2) {
                this.error = error + 'Alert: "' + str + '" has too much "' + annEnd + '" (' + this.bandName + ')\n'
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
    if (!arr) return [];
    const valids = arr.filter(el => el && el.extension)
    return valids.filter(el =>
        songsFormats.includes(el.extension.toLowerCase().replace('.', '')))
}