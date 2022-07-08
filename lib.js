/**
 * Library functions that might be needed anywhere. 
 */
const url = require('url');
const path = require('path');

// Todo : documentDistance can be improved
// 1. (MEDIUM) to handle separators like . , etc. 
// 2. (EASY) to handle case sensitive and insensitive situations
// 3. (HARD) to handle word roots and similar words (eg. tasty and delicious)
module.exports.documentDistance = function documentDistance(d1, d2){
    const vector = doc => doc.split(' ').reduce((obj, word)=>{
        word = word.toLowerCase();
        if(obj.hasOwnProperty(word)) obj[word]++;
        else obj[word] = 1;
        return obj;
    }, {});
    const dotProd = (v1, v2)=> Object.keys(v1).reduce((sum, key)=> sum+v1[key]*(v2.hasOwnProperty(key) ? v2[key] : 0), 0);
    const size = (x) => Object.values(vector(x)).reduce((sum, v)=>sum + v**2, 0)**0.5;
    return dotProd(vector(d1), vector(d2))/(size(d1)*size(d2));
}

module.exports.urlPath = function urlPath(reqURL) {
    let {pathname} = url.parse(reqURL);
    let fileURL = path.resolve(decodeURIComponent(pathname).slice(1));
    if (fileURL != process.cwd() &&
        !fileURL.startsWith(process.cwd() + path.sep)) {
      throw {status: 403, body: "Forbidden"};
    }
    return fileURL;
}