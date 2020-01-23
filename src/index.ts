import { readFolders, MetalFolder, extractMetalBandsFromMetalFolder } from "./readFolders"
import { MetalBand } from './bandClass';
import { generateLocalFilesReportOutputs } from './util';
import { generateMetallumCompareReports } from './metallumCompare';

//metallumDiscographyByBandName('darkthrone') // search band example

// Your metal folder location
const metalFolderAddress = 'E:\\Music';

// Reads all subfolders from selected folder
const metalFolderObj: MetalFolder = readFolders(metalFolderAddress);

// Treats first level folders as bands (use extractMetalBandsFromMetalFolder(metalFolderObj,true) if your first level folders are genre folders)
const bandObjs: MetalBand[] = extractMetalBandsFromMetalFolder(metalFolderObj);

// saves general .txt and .csv reports about your files
generateLocalFilesReportOutputs(bandObjs);

// compares your files with metallum database and saves .txt and .csv reports
generateMetallumCompareReports(bandObjs);
