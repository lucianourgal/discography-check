import { MetalBand } from './bandClass';
import { metallumAlbum } from './metallumRequest';
import { sleep, missingAlbumLine } from './util';
import { writeFileSync } from 'fs';

/**
 * @description Gets metallum data band by band, compares hard drive state to data and generates .txt and .csv reports
 * @param bandObjs Hard drive array of objects
 */
export const generateMetallumCompareReports = async (bandObjs: MetalBand[]): Promise<void> => {

    if (!bandObjs || !bandObjs.length) {
        return;
    }

    let missingAlbunsCsv = 'Band;Album;Year;Reviews Count;Reviews Average\n';
    let allMissingAlbums: metallumAlbum[] = [];
    let albumSearchReport = '';
    let albumSearchReportCsv = 'Band; Missing Count; Metallum Count; HD albuns count; Completion rate; Missing albums; HD album options';
    let textReport = '';

    let failCount = 0;

    // Band completion check loop
    for (let x = 0; x < bandObjs.length; x++) {

        const cur = bandObjs[x];

        // Extracts infos about found bands from metallum
        const textLine = await cur.searchMetallumData();
        if (textLine) textReport += textLine + '\n';

        // Checks which albums are missing for each band
        let missingAlbums = cur.getMissingAlbums()
        if (missingAlbums && missingAlbums.length) {
            allMissingAlbums.push(...missingAlbums);
        } else {
            failCount++;
        }

        albumSearchReport += cur.getAlbumCheckReport() + '\n';
        const csvReport = cur.getAlbumCheckReportCsv();
        if (csvReport) {
            albumSearchReportCsv += '\n' + csvReport;
        }

        // avoid overcharging metallum
        await sleep(200);
    }

    allMissingAlbums = allMissingAlbums.sort((a, b) => b.year - a.year);
    missingAlbunsCsv += allMissingAlbums.map(ma => missingAlbumLine(ma)).join('\n');

    const completeBands = bandObjs.filter(band => band.getIsDiscographyComplete());
    const notFoundBands = bandObjs.filter(band => !band.isBandFoundAtMetallum());
    const notFoundBandsString = notFoundBands.map(cur => cur.getName() + ' - ' + cur.getAlbunsCount() + ' album(s) on disk').join('\n')

    const textRepStart = 'Found discographys about ' + (bandObjs.length - failCount) + ' / ' + bandObjs.length + ' bands\n' +
        completeBands.length + ' bands have their discographys complete. \n' +
        'You have around ' + allMissingAlbums.length + ' missing albums.\n';

    // Generates report files
    writeFileSync('outputs/Missing_albums.csv', missingAlbunsCsv);
    writeFileSync('outputs/Album_search_report.txt', textRepStart + textReport);
    writeFileSync('outputs/Album check report.txt', albumSearchReport);
    writeFileSync('outputs/Album check report.csv', albumSearchReportCsv);
    writeFileSync('outputs/Not found bands.txt', notFoundBandsString);

    console.log('\n' + textRepStart);
}