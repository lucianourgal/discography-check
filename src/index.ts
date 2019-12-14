import { readFolders, MetalFolder, extractMetalBandsFromMetalFolder } from "./readFolders"
import { MetalBand } from './bandClass';
import { generateReportOutputs, sleep } from './util';
import { writeFileSync } from 'fs';

//metallumDiscographyByBandName('darkthrone') // search band example

// Reads folder location from configs.txt file
const metalFolderAddress = 'E:\\Music'

// Reads all subfolders from selected folder
const metalFolderObj: MetalFolder = readFolders(metalFolderAddress);

// Treats first level folders as bands
const bandObjs: MetalBand[] = extractMetalBandsFromMetalFolder(metalFolderObj);

// saves .txt and .csv reports
generateReportOutputs(bandObjs);

(async () => {

    if (bandObjs) {

        let missingAlbunsCsv = 'Band;Album;Year;\n';
        let albumSearchReport = '';
        let textReport = '';

        let failCount = 0;

        for (let x = 0; x < bandObjs.length; x++) {

            const cur = bandObjs[x];

            // Extracts infos about found bands from metallum
            const textLine = await cur.searchMetallumData();
            if(textLine) textReport += textLine + '\n';

            // Checks which albums are missing for each band
            const missingAlbums = cur.getMissingAlbums();
            if (missingAlbums && missingAlbums.length) {
                missingAlbunsCsv += missingAlbums.map(ma => cur.getName() + ';' + ma.name + ';' + ma.year).join('\n') + '\n';
            } else {
                failCount++;
            }

            albumSearchReport += cur.getAlbumCheckReport() + '\n';

            // avoid overcharging metallum
            await sleep(200);
        }

        const completeBands = bandObjs.filter(band => band.getIsDiscographyComplete());


        const textRepStart = 'Found discographys about ' + (bandObjs.length-failCount) + ' / ' + bandObjs.length + ' bands\n' +
        completeBands.length + ' bands have their discographys complete. \n\n';
        // Generates report files
        writeFileSync('outputs/Missing_albums.csv', missingAlbunsCsv);
        writeFileSync('outputs/Album_search_report.txt', textRepStart + textReport);
        writeFileSync('outputs/Album check report.txt', albumSearchReport);

    }

})();
