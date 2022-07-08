const { Server } = require('http');
const fs = require('fs').promises;
const mime = require('mime-types');
const { urlPath, documentDistance } = require('./lib.js');
const DOCS = [];   // store the DOCS to search from
/*
Build serviceWorker.js from build_service_worker.js
by calling the template dynamically with the names of the files in docs directory

Also fill DOCS with data
*/
(async function(){
    const docNames = (await fs.readdir('./docs')).map(fname=>'./docs/'+fname)
    fs.writeFile('serviceWorker.js', require('./build_service_worker.js')(docNames, documentDistance));
    (await Promise.all(docNames.map(doc=>fs.readFile(doc, 'utf-8')))).forEach((text, i)=>DOCS.push({
        text : text.trim(),
        url : docNames[i]
    }));
})();

new Server(async (req, res)=>{
    if(req.url==='/') req.url='/index.html';
    if(req.url.startsWith('/search')) searchTheDocs(req.url.slice(8), res);
    return serve(req.url, res).catch(error=>{
        res.writeHead(error.status || 500, {'Content-Type' : 'text/html'});
        res.write(error.body || error.message);
        res.end();
    });
    // serve assets from all directories with the correct type
    function serve(url, res){ 
        return fs.readFile(urlPath(url), 'utf-8').then(
            file =>{
                res.writeHead(200, {'Content-Type' : mime.lookup(url)});
                res.write(file);
                res.end();
            }
        );
    }

    function searchTheDocs(query, res){
      DOCS.forEach(doc=>(doc.dist=documentDistance(query, doc.text)));
      DOCS.sort((d1, d2) => d2.dist - d1.dist);
      res.writeHead(200, {'Content-Type' : mime.lookup('json')});
      res.write(JSON.stringify(DOCS.map(doc=>doc.url)));
      res.end();
    }
}).listen(3000, ()=>{
    console.log('Server started on localhost:3000');
});