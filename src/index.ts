import { readFolders, MetalFolder } from "./readFolders"
import { MetalBand } from './bandClass';
import { generateReportOutputs } from './util';


console.log("CHOCOLATE!!!!")

// Reads folder location from configs.txt file
const metalFolderAddress = 'E:\\Music'

// Reads all subfolders from selected folder
const metalFolderObj: MetalFolder = readFolders(metalFolderAddress);

// Treats first level folders as bands
let bandObjs: MetalBand[] = metalFolderObj.children.map(bandFolder => new MetalBand(bandFolder));
generateReportOutputs(bandObjs);

// Extracts infos about found bands from metallum

// Checks which albums are missing for each band

// Generates a .html report