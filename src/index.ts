import { readFolders, MetalFolder } from "./readFolders"
import { MetalBand } from './bandClass';
import { writeFileSync } from 'fs';


console.log("CHOCOLATE!!!!")

// Reads folder location from configs.txt file
const metalFolderAddress = 'D:\\METAL'

// Reads all subfolders from selected folder
const metalFolderObj: MetalFolder = readFolders(metalFolderAddress);

// Treats first level folders as bands
let bandObjs: MetalBand[] = metalFolderObj.children.map(bandFolder => new MetalBand(bandFolder));
bandObjs = bandObjs.filter(band => band.getIsBand())
const reports = bandObjs.map(el => el.getReport());
writeFileSync('outputs/Your metal folders report.txt', reports.join('\n'));

// Extracts infos about found bands from metallum

// Checks which albums are missing for each band

// Generates a .html report