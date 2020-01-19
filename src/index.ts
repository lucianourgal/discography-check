import { readFolders, MetalFolder, extractMetalBandsFromMetalFolder } from "./readFolders"
import { MetalBand } from './bandClass';
import { generateReportOutputs, sleep, missingAlbumLine } from './util';
import { writeFileSync } from 'fs';
import { metallumAlbum } from './metallumRequest';

//metallumDiscographyByBandName('darkthrone') // search band example

// Your metal folder location
const metalFolderAddress = 'E:\\Music'

// Reads all subfolders from selected folder
const metalFolderObj: MetalFolder = readFolders(metalFolderAddress);

// Treats first level folders as bands
const bandObjs: MetalBand[] = extractMetalBandsFromMetalFolder(metalFolderObj);

// saves general .txt and .csv reports about your files
generateReportOutputs(bandObjs);

// compares your files with metallum database and saves reports
(async () => {

    if (bandObjs) {

        let missingAlbunsCsv = 'Band;Album;Year;Reviews Count;Reviews Average\n';
        let allMissingAlbums: metallumAlbum[] = [];
        let albumSearchReport = '';
        let textReport = '';

        let failCount = 0;

        for (let x = 0; x < bandObjs.length; x++) {

            const cur = bandObjs[x];

            // Extracts infos about found bands from metallum
            const textLine = await cur.searchMetallumData();
            if(textLine) textReport += textLine + '\n';

            // Checks which albums are missing for each band
            let missingAlbums = cur.getMissingAlbums()
            if (missingAlbums && missingAlbums.length) {
                allMissingAlbums.push(...missingAlbums);
            } else {
                failCount++;
            }

            albumSearchReport += cur.getAlbumCheckReport() + '\n';

            // avoid overcharging metallum
            await sleep(200);
        }

        allMissingAlbums = allMissingAlbums.sort((a, b) => b.year - a.year);
        missingAlbunsCsv += allMissingAlbums.map(ma => missingAlbumLine(ma)).join('\n');

        const completeBands = bandObjs.filter(band => band.getIsDiscographyComplete());
        const notFoundBands = bandObjs.filter(band => !band.isBandFoundAtMetallum());
        const notFoundBandsString = notFoundBands.map(cur => cur.getName() + ' - ' + cur.getAlbunsCount() + ' album(s) on disk' ).join('\n')


        const textRepStart = 'Found discographys about ' + (bandObjs.length-failCount) + ' / ' + bandObjs.length + ' bands\n' +
        completeBands.length + ' bands have their discographys complete. \n' + 
        'You have around ' + allMissingAlbums.length + ' missing albums.\n';
        // Generates report files
        writeFileSync('outputs/Missing_albums.csv', missingAlbunsCsv);
        writeFileSync('outputs/Album_search_report.txt', textRepStart + textReport);
        writeFileSync('outputs/Album check report.txt', albumSearchReport);
        writeFileSync('outputs/Not found bands.txt', notFoundBandsString);

        console.log('\n' + textRepStart);
    }

})();
