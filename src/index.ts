import { readFolders, MetalFolder, extractMetalBandsFromMetalFolder } from "./readFolders"
import { MetalBand } from './bandClass';
import { generateReportOutputs } from './util';
import { metallumDiscographyByBandName } from './metallumRequest';

//metallumDiscographyByBandName('darkthrone')

// Reads folder location from configs.txt file
const metalFolderAddress = 'D:\\METAL'

// Reads all subfolders from selected folder
const metalFolderObj: MetalFolder = readFolders(metalFolderAddress);

// Treats first level folders as bands
const bandObjs: MetalBand[] = extractMetalBandsFromMetalFolder(metalFolderObj);

// saves .txt and .csv reports
generateReportOutputs(bandObjs);

// Extracts infos about found bands from metallum
if (bandObjs) {
    bandObjs.forEach(band => band.searchMetallumData());

    // Checks which albums are missing for each band

    // Generates a .html report 

}
