import { MetalBand } from './bandClass';
import { writeFileSync } from 'fs';
import { flatten } from 'lodash'
import { MetalFolder } from './readFolders';

export const generateReportOutputs = (bandObjs: MetalBand[]) => {

    bandObjs = bandObjs.filter(band => band.getIsBand())
    let reportFileName = '';

    try {
        reportFileName = 'outputs/Your metal folders report.txt'
        const reports = bandObjs.map(el => el.getReport());
        writeFileSync(reportFileName, metalBandsArrMetadata(bandObjs) + reports.join('\n'));
    } catch (e) {
        console.log('[ERROR] Could not save ' + reportFileName + ' to disk.')
    }

    try {
        reportFileName = 'outputs/You metal albums report.csv'
        const bandAlbums = bandObjs.map(el => el.getBandAlbumList())
        const bandAlbunsCsv = flatten(bandAlbums.map(band => band.albumNames.map((album: string): string => band.bandName + ';' + album)));
        writeFileSync(reportFileName, bandAlbunsCsv.join('\n'));
    } catch (e) {
        console.log('[ERROR] Could not save ' + reportFileName + ' to disk.')
    }

    try {
        reportFileName = 'outputs/You metal albums naming errors.txt'
        const bandAlbunsErrors = bandObjs.map(el => el.getBandAlbumErrors()).filter(el => !!el);
        writeFileSync(reportFileName, '\n' + bandAlbunsErrors.join(''));
    } catch (e) {
        console.log('[ERROR] Could not save ' + reportFileName + ' to disk.')
    }


    console.log('Reports about your local metal library were saved to outputs folder');
}


const metalBandsArrMetadata = (bands: MetalBand[]) => {
    let albunsCounts = bands.map(band => band.getAlbunsCount());
    let songsCounts = bands.map(band => band.getSongsInChildsCount());

    const sumReducer = (total: number, newValue: number) => total + newValue;
    const albuns = albunsCounts.reduce(sumReducer, 0);
    const songs = songsCounts.reduce(sumReducer, 0);

    return bands.length + ' bands, ' + albuns + ' albums and ' + songs + ' songs found.' +
        '\n\n';
}


export const extractMetalBandsFromMetalFolder = (folder: MetalFolder, genreFoldersBelow: boolean = false): MetalBand[] => {

    if (genreFoldersBelow) {
        const genreFolders = folder.children;
        const metalBandFolders: MetalBand[] = flatten(genreFolders.map(genreFolder => genreFolder.children.map(bandFolder => new MetalBand(bandFolder))));
        return metalBandFolders;
    } else {
        return folder.children.map(bandFolder => new MetalBand(bandFolder));
    }

}