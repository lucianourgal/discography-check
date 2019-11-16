import { readFolders, MetalFolder, extractMetalBandsFromMetalFolder } from "./readFolders"
import { MetalBand } from './bandClass';
import { generateReportOutputs } from './util';


console.log("CHOCOLATE!!!!")

// Reads folder location from configs.txt file
const metalFolderAddress = 'E:\\Music'

// Reads all subfolders from selected folder
const metalFolderObj: MetalFolder = readFolders(metalFolderAddress);

// Treats first level folders as bands
const bandObjs: MetalBand[] = extractMetalBandsFromMetalFolder(metalFolderObj);

// saves .txt and .csv reports
generateReportOutputs(bandObjs);

// Extracts infos about found bands from metallum

// Checks which albums are missing for each band

// Generates a .html report