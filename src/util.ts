import { MetalBand } from './bandClass';
import { writeFileSync } from 'fs';
import { flatten } from 'lodash'

export const generateReportOutputs = (bandObjs: MetalBand[]) => {

    bandObjs = bandObjs.filter(band => band.getIsBand())

    const reports = bandObjs.map(el => el.getReport());
    writeFileSync('outputs/Your metal folders report.txt', reports.join('\n'));

    const bandAlbums = bandObjs.map(el => el.getBandAlbumList())
    const bandAlbunsCsv = flatten(bandAlbums.map(band => band.albumNames.map((album:string):string => band.bandName+';'+album)));
    writeFileSync('outputs/You metal albums report.csv', bandAlbunsCsv.join('\n') );

    const bandAlbunsErrors = bandObjs.map(el => el.getBandAlbumErrors());
    writeFileSync('outputs/You metal albums naming errors.txt',bandAlbunsErrors.join('') );

    
}