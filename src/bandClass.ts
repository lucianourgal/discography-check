import { Child, MetalFolder, songsFormats } from './readFolders';
import { flatten } from 'lodash';
import { metallumBandData, metallumDiscographyByBandName, metallumAlbum } from './metallumRequest';
import { standString, replaceAll } from './util';

export class MetalBand {

    private albuns: MetalAlbum[];
    private name: string;
    //private genres: { name: string, momment: 'early' | 'mid' | 'late' }[];
    private isBand: boolean;
    private path: string;
    private songsInRootFolder: Child[];

    private metallumData: metallumBandData;
    private albumCheckReport: string;
    private albumCheckReportCsv: string;
    private isDiscographyComplete: boolean;

    constructor(bandData: Child) {
        this.name = bandData.name;
        this.albuns = [];
        //this.genres = [];
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

    /**
     * @description Makes request to metallum to get this band data, if available
     * @returns string report
     */
    public async searchMetallumData(): Promise<string> {

        const possibleMetallumData: metallumBandData[] = await metallumDiscographyByBandName(this.name);

        if (!possibleMetallumData) {
            return '[Error] Nothing was found related to band <<' + this.name + '>>.';
        }

        let closestMatch: metallumBandData;
        let closestMatchCount = 0;
        const folderAlbumNames = this.getBandAlbumList().albumNames.map(s => standString(s));

        for (let x = 0; x < possibleMetallumData.length; x++) { // check bands possibilities 
            let count = 0;
            const mAlb = possibleMetallumData[x].albums && possibleMetallumData[x].albums.map(album => standString(album.name));
            if (mAlb)
                for (let a = 0; a < mAlb.length; a++) { // metallum album by metallum album
                    if (folderAlbumNames.includes(mAlb[a])) {
                        count++;
                    }
                }
            // check if this is the closest match
            if (count > closestMatchCount) {
                closestMatchCount = count;
                closestMatch = possibleMetallumData[x];
            }
        }

        if (closestMatch) {
            const report = '[Ok] Band <<' + this.name + '>> has a match! ' + closestMatchCount + ' album matchs. ' +
                '(metallum ' + closestMatch.albums.length + ', HD ' + this.getAlbunsCount() + ')';
            console.log(report);
            this.metallumData = closestMatch;
            return report;
        }
        return null;
    }

    /**
     * @description Uses previous loaded metallum albums to compare with your hard drive band albums
     * @returns Albums from this band that weren't found in you hard drive but were at metallum
     */
    public getMissingAlbums(): metallumAlbum[] {

        if (!this.metallumData) return null;
        const mAlbums = this.metallumData.albums;
        if (!mAlbums) return null;
        //const debug = this.getName() === 'Band you want to debug'

        const hdAlbums = this.getBandAlbumList().albumNames.map(cur => standString(cur));
        //if(debug) console.log(this.getName() + ' hdAlbuns = ' + hdAlbums.join('; '));

        const missing: metallumAlbum[] = [];

        for (let a = 0; a < mAlbums.length; a++) {
            const name = standString(mAlbums[a].name);
            //if(debug) console.log('looking for >'+ name + '< album');
            if (!hdAlbums.includes(name)) {
                mAlbums[a].band = this.getName();
                missing.push(mAlbums[a]);
                //if(debug) console.log('>' + name + '< album not found!')
            }
        }

        const missingAlbumsString = missing.map(ma => ma.name + '(' + ma.year + ')').join(', ');
        const optionsString = this.getBandAlbumList().albumNames.join(', ')
        const completionRate = ((1 - (missing.length / mAlbums.length)) * 100).toFixed(0);

        this.albumCheckReport = '[' + this.name + '] Missing albums: ' + missing.length + ' / ' + mAlbums.length + ' (' + completionRate + '%)\n' +
            (missing.length ?
                'Missing names: ' + missingAlbumsString + '\n' +
                'Available options: ' + optionsString + '\n' : '');

        // Band; Missing Count; Metallum Count; HD albuns count; Completion rate; Missing albums; HD album options
        this.albumCheckReportCsv = this.name + '; ' + missing.length + '; ' + mAlbums.length + "; " + this.getAlbunsCount() + '; ' +
            + completionRate + '; ' + missingAlbumsString + '; ' + optionsString;

        this.isDiscographyComplete = missing.length === 0;

        return missing;
    }

    /**
     * @returns discography completion boolean
     */
    public getIsDiscographyComplete(): boolean {
        return this.isDiscographyComplete;
    }

    /**
     * @returns Album check report string
     */
    public getAlbumCheckReport(): string {
        return this.albumCheckReport ? this.albumCheckReport : '[' + this.name + '] There is no album check report\n';
    }

    /**
     * @returns Album check report CSV string
     */
    public getAlbumCheckReportCsv(): string {
        return this.albumCheckReportCsv ? replaceAll(this.albumCheckReportCsv, '"', '') : null;
    }

    /**
     * @returns Boolean which indicates if this folder is a band folder
     */
    public getIsBand(): boolean {
        return this.isBand;
    }

    /**
     * @returns unfiltered folder name (which is problably the band name)
     */
    public getName(): string {
        return this.name;
    }

    /**
     * @returns child folder which are album folder integer counter
     */
    public getAlbunsCount(): number {
        return this.albuns ? this.albuns.length : 0;
    }

    /**
     * @returns integer counter
     */
    public getSongsInChildsCount(): number {
        const countsPerAlbum: number[] = this.albuns.map(album => album.getSongsCount());
        const sumReducer = (total: number, newValue: number) => total + newValue;

        return countsPerAlbum.reduce(sumReducer, 0);
    }

    /**
     * @returns integer counter
     */
    public songsInRootFolderCount(): number {
        return this.songsInRootFolder ? this.songsInRootFolder.length : 0;
    }


    /**
     * @returns boolean indicating if there is metallum data related to this folder/band
     */
    public isBandFoundAtMetallum(): boolean {
        return !!this.metallumData;
    }

    /**
     * @returns Band report about its songs and albums in this hard drive
     */
    public getReport(): string {
        const songsCount = this.songsInRootFolderCount();
        const albunsCount = this.getAlbunsCount();

        return this.name + ': ' +
            (albunsCount ? albunsCount + ' album' + (albunsCount > 1 ? 's' : '') + '; ' : '') +
            (songsCount ? songsCount + ' songs in root folder.' : '') +
            ((songsCount + albunsCount) === 0 ? 'Nothing found.' : '');
    }

    /**
     * @returns Band and album names object
     */
    public getBandAlbumList() {
        return { bandName: this.name, albumNames: this.albuns.map(album => album.getFilteredAlbumName()) }
    }

    /**
     * @description Checks album objects for error reports and summarize them in one string
     * @returns report string
     */
    public getBandAlbumErrors(): string {
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

    /**
     * @returns integer counter
     */
    public getSongsCount(): number {
        return this.songs ? this.songs.length : 0;
    }

    /**
     * @description This field needs to be calculated previously
     * @returns boolean indicating if this is folder containing songs - problably a band album
     */
    public getIsAlbum(): boolean {
        return this.isAlbum;
    }

    /** 
     * @returns Standartized album name
     */
    public getFilteredAlbumName() {

        const nameStandart = this.name.replace(' ', '').replace('2', '1').replace('3', '1').toUpperCase();
        const isCDFolderInsideAlbumFolder = nameStandart.startsWith('CD1')

        return isCDFolderInsideAlbumFolder ? this.filterAlbumName(this.parentFolderName)
            : this.filterAlbumName(this.name);
    }

    /**
     * @deprecated
     * @returns found errors report string
     */
    public getError() {
        return this.error;
    }


    /**
     * @description inner MetalAlbum function to standartize albums names
     * @param str string to be standartized
     */
    private filterAlbumName(str: string): string {

        // remove ()
        let filtered = this.removeAnnotation(str, '(', ')');
        // remove []
        filtered = this.removeAnnotation(filtered, '[', ']');
        // Ignores anything before - symbol 
        if (filtered.includes('-') && filtered.split('-')[0].length > 2) {
            const split = filtered.split('-');
            split[0] = '';
            filtered = split.join(' ').trim();
        }

        return replaceAll(filtered, '_', ' ').trim();
    }

    /**
     * @description inner MetalAlbum function to remove annotations
     * @param str string to be standartized
     * @param annStart character that indicates begin of annotation
     * @param annEnd character that indicated annotation's end
     */
    private removeAnnotation(str: string, annStart: string, annEnd: string) {
        if (str.includes(annStart) && str.includes(annEnd)) {
            let error = '';
            const splitStart = str.split(annStart);
            if (splitStart.length !== 2) {

                const newStr = replaceAll(str, annEnd, annStart);
                const split = newStr.split(annStart);
                let response = '';
                for (let i = 0; i < split.length; i = i + 2) {
                    response += split[i];
                }

                response = this.filterAlbumName(response.trim());
                /*this.error = 'Alert: "' + str + '" has too much "' + annStart + '"  (' + this.bandName + ') returning "' + response + '"\n'
                console.log(this.error);*/
                return response;
            }
            const splitEnd = splitStart[1].split(annEnd);

            return splitStart[0] + splitEnd[1];
        } else {
            return str;
        }
    }

}

/**
 * @description Filters songs
 * @param arr Child nodes - files and folders
 * @returns song files
 */
const getSongsFromChildArray = (arr: Child[]): Child[] => {
    if (!arr) return [];
    const valids = arr.filter(el => el && el.extension)
    return valids.filter(el =>
        songsFormats.includes(el.extension.toLowerCase().replace('.', '')))
}