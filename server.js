const { Server } = require('http');
const fs = require('fs').promises;
const mime = require('mime-types');
const path = require('path');
const url = require('url');
/*
Build serviceWorker.js from build_service_worker.js
by calling the template dynamically with the names of the files in docs directory
*/
(async function(){
    fs.writeFile('serviceWorker.js', require('./build_service_worker.js')((
        await fs.readdir('./docs')).map(fname=>'./docs/'+fname)))
})();

new Server(async (req, res)=>{
    if(req.url==='/') req.url='/index.html';
    // todo : we need a different, dynamic handler for /search/<string>
    // implement searchTheDocs
    if(req.url.startsWith('/search')) return searchTheDocs(req.url.slice(7));
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
    function urlPath(reqURL) {
        let {pathname} = url.parse(reqURL);
        let fileURL = path.resolve(decodeURIComponent(pathname).slice(1));
        if (fileURL != process.cwd() &&
            !fileURL.startsWith(process.cwd() + path.sep)) {
          throw {status: 403, body: "Forbidden"};
        }
        return fileURL;
      }
      function searchTheDocs(query){
        // still to implement
        // the idea : load the documents globally on server start, and use those
        // later, if we find that we're having to restart the server everytime a doc is added, 
        // we can shift to a database or such to serve the online responses, while keeping the
        // queries the same /docs
      }
}).listen(3000);