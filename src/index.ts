import { readFolders, MetalFolder, extractMetalBandsFromMetalFolder } from "./readFolders"
import { MetalBand } from './bandClass';
import { generateReportOutputs, sleep } from './util';
import { metallumDiscographyByBandName } from './metallumRequest';
import { writeFileSync } from 'fs';

//metallumDiscographyByBandName('darkthrone')

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

        let missingAlbunsReport = 'Band;Album;Year;\n';
        let textReport = '';

        for (let x = 0; x < bandObjs.length; x++) {

            const cur = bandObjs[x];

            // Extracts infos about found bands from metallum
            const textLine = await cur.searchMetallumData();
            if(textLine) textReport += textLine + '\n';

            // Checks which albums are missing for each band
            const missingAlbums = cur.getMissingAlbums();
            if (missingAlbums && missingAlbums.length) {
                missingAlbunsReport += missingAlbums.map(ma => cur.getName() + ';' + ma.name + ';' + ma.year).join('\n') + '\n';
            }

            // avoid overcharging metallum
            await sleep(200);
        }

        // Generates report files
        writeFileSync('outputs/Missing_albums.csv', missingAlbunsReport);
        writeFileSync('outputs/Album_search_report.txt', textReport);
    }

})();
