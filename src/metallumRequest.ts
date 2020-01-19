import axios from 'axios'

const debugMode = false;

interface metallumSearchResult {
    genre: string;
    country: string;
    url: string;
}

interface metallumAlbum {
    name: string;
    type: string;
    year: number;

    reviewCount?: string;
    reviewsAverage?: string;
    band?: string;
}

interface metallumBandData {
    searchResult: metallumSearchResult;
    albums: metallumAlbum[];
}

const metallumDiscographyByBandName = async (bandName: string): Promise<metallumBandData[]> => {
    const bandOptions: metallumSearchResult[] = await metallumSearchBand(bandName);
    if (!bandOptions || !bandOptions.length) {
        console.log('[Error] Band <<' + bandName + '>> has no results');
        return null;
    }
    const bandUrls: string[] = await Promise.all(bandOptions.map(bandOpt => metallumGetDiscographyUrl(bandOpt.url, bandName)));
    if (!bandUrls || !bandUrls.length) {
        console.log('[Error] Band <<' + bandName + '>> has no url results');
        return null;
    }
    const bandDiscographys: metallumAlbum[][] = await Promise.all(bandUrls.map(bandUrl => metallumGetDiscography(bandUrl, bandName)));

    const response: metallumBandData[] = [];
    for (let x = 0; x < bandOptions.length; x++) {
        response.push({
            searchResult: bandOptions[x],
            albums: bandDiscographys[x]
        } as metallumBandData);
    }

    return response;
}


const metallumSearchBand = async (bandName: string): Promise<metallumSearchResult[]> => {

    const url = 'https://www.metal-archives.com/search/ajax-band-search/?field=name&query=' + bandName +
        '&sEcho=1&iColumns=3&sColumns=&iDisplayStart=0&iDisplayLength=200&mDataProp_0=0&mDataProp_1=1&mDataProp_2=2 '
    let results: metallumSearchResult[];

    return await axios.get(url)
        .then(res => {
            const bulk = res.data.aaData

            results = bulk.map(band => ({
                genre: band[1], country: band[2],
                url: band[0].split('"')[1]
            } as metallumSearchResult));

            if (debugMode) console.log(results.map(cur => cur.url + ', ' + cur.genre + ', ' + cur.country).join('\n'));
            return results;
        })
        .catch(err => {
            console.log('[Error] Failed to search using metallum (' + bandName + ')');
            return null;
        })
}

const metallumGetDiscographyUrl = async (url: string, bandName: string): Promise<string> => {

    return await axios.get(url)
        .then(res => {
            const split = String(res.data).split('<span>Complete discography</span>');
            const urlFound = split[1].split('"')[1];

            return urlFound;
        })
        .catch(err => {
            //console.log('[Error] Failed to retrieve metallum discography of "' + bandName + '" url - ' + url);
            return null;
        })

}

const metallumGetDiscography = async (url: string, bandName?: string): Promise<metallumAlbum[]> => {

    const albums: metallumAlbum[] = [];
    if (!url) return null;

    return await axios.get(url)
        .then(res => {
            const str = String(res.data);
            if (str) {
                const trSplit = str.split('<tbody>')[1].split('<tr>');


                for (let x = 1; x < trSplit.length; x++) {
                    if (trSplit[x]) {
                        const tdSplit = trSplit[x].split('<td>');

                        if (tdSplit[1] && tdSplit[2] && tdSplit[3]) {
                            const name = tdSplit[1].split('">')[1].split('</a>')[0];
                            const type = tdSplit[2].split('</td')[0];
                            const year = parseInt(tdSplit[3].split('</td')[0]);

                            const r = tdSplit[4].split('</td')[0].split('">');
                            let reviews = '';
                            let reviewCount = '';
                            let reviewsAverage = '';

                            if(r.length > 1) {
                                reviews = r[1].split('</a>')[0];

                                reviewCount = reviews.split('(')[0].trim();
                                reviewsAverage = reviews.split('(')[1].split('%')[0];
                            }
                            albums.push({ name, type, year, reviews, reviewCount, reviewsAverage } as metallumAlbum);
                        }
                    }
                }
                if (debugMode) console.log(albums.map(cur => cur.name + ', ' + cur.type + ', ' + cur.year).join('\n'));

                return albums;
            }
            console.log('[Error] Failed to retrieve metallum discography - ' + url + (
                bandName ? ' (' + bandName + ')' : '') + ' res.data is null');
            return null;
        })
        .catch(err => {
            console.log('[Error] Failed to retrieve metallum discography - ' + url + (
                bandName ? ' (' + bandName + ')' : '') + err.message);
            return null;
        })

}


export {
    metallumSearchBand, metallumGetDiscographyUrl, metallumGetDiscography, // inner functions
    metallumSearchResult, metallumAlbum, metallumBandData, // interfaces
    metallumDiscographyByBandName // main function
}