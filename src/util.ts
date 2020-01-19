import { MetalBand } from './bandClass';
import { writeFileSync } from 'fs';
import { flatten } from 'lodash'
import { accentFold } from '@stefancfuchs/utils'
import { metallumAlbum } from './metallumRequest';

export const generateReportOutputs = (bandObjs: MetalBand[]) => {

    if(!bandObjs) {
        // console.log('[Error] Cant generate report from empty metal band');
        return null;
    }

    bandObjs = bandObjs.filter(band => band.getIsBand())
    let reportFileName = '';

    reportFileName = 'outputs/Your metal folders report.txt'
    const reports = bandObjs.map(el => el.getReport());
    writeFileTryCatchWrap(reportFileName, metalBandsArrMetadata(bandObjs) + reports.join('\n'));

    reportFileName = 'outputs/You metal albums report.csv'
    const bandAlbums = bandObjs.map(el => el.getBandAlbumList())
    const bandAlbunsCsv = flatten(bandAlbums.map(band => band.albumNames.map((album: string): string => band.bandName + ';' + album)));
    writeFileTryCatchWrap(reportFileName, bandAlbunsCsv.join('\n'));

    reportFileName = 'outputs/You metal albums naming errors.txt'
    const bandAlbunsErrors = bandObjs.map(el => el.getBandAlbumErrors()).filter(el => !!el);
    writeFileTryCatchWrap(reportFileName, '\n' + bandAlbunsErrors.join(''));

    console.log('Reports about your local metal library were saved to outputs folder');
}


const writeFileTryCatchWrap = (fileName: string, text: string) => {
    try {
        writeFileSync(fileName, text);
    } catch (e) {
        console.log('[ERROR] Could not save ' + fileName + ' to disk.')
    }
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


export const standString = (str1: string) => {
    let norm = str1.toLowerCase().trim();
    norm = norm.replace('.','').replace(',','');
    return accentFold(norm);
}

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

export const missingAlbumLine = (ma: metallumAlbum) => {
    return ma.band + ';' + ma.name + ';' + ma.year + ';' + ma.reviewCount + ';' + ma.reviewsAverage
}