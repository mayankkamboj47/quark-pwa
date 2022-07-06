/**
 * offlineAssets : Things that will be precached when the service worker installs 
 * Note : This is not the same as 'when the app is installed'
 */
const offlineAssets = ['./', '/styles/index.css', './main.js'];
/* offline Docs are files the search engine will search from. 
Testing only. Soon, entire docs directory will be dynamically loaded. 
*/
const offlineDocs = ['./docs/1.html', './docs/2.html', './docs/3.html'];
self.addEventListener('install', (e)=>{
    console.log('Service worker installed');
    e.waitUntil(addAllToCache(offlineAssets));
    e.waitUntil(addToTaggedCache(offlineDocs));
});

self.addEventListener('activate', () => {
    console.log('Service worker activated');
});

self.addEventListener('fetch', (e)=>{
    console.log('Worker intercepted', e.request.method, 'request',
                'to', e.request.url);
    e.respondWith(cacheNetworkRace(e.request));
});

/**
 * ++++++++++++++++++++
 * Helper functions
 * ++++++++++++++++++++
 */

function addAllToCache(resources){
    return caches.open('assets').then(cache => cache.addAll(resources));
}

function addToTaggedCache(resources) {
    return caches.open('tagged').then(taggedCache => {
        return Promise.all(resources.map(resource=>{
            return fetch(resource).then((response)=>{
                // tagify is yet to be implemented.
                // do something with tags, like store them properly in indexedDB
                // before that, the project will probably be moved to workbox. 
                // or is it a good decision ? Time to git it. 
                return taggedCache.put(resource, response);
            });
        }));
    });
}

/**
 * To fix : We need to somehow compare the two responses in cacheFinish.then, 
 * the 'r' and 'res' and cache the more fresh one. This will require checking the
 * response time data, if such a thing is available
 */
function cacheNetworkRace(request){
    return new Promise((resolve, reject)=>{
        const cacheFinish = router(request).then(r=>{
            // we finished the response battle
            if(r.status >=200 && r.status < 300) {
                // but only resolve if we also won the 200-status war
                resolve(r);
                return r;
            }
        }).catch(()=>{});
        fetch(request).then(res=>{
            caches.open('responses').then(responses=>{
                // once network finishes, wait for cache to finish
                // and then cache this response if needed
                cacheFinish.then(r=>r ? null : responses.put(request, res.clone()));
                // but don't wait. Resolve immediately with what we have. 
                resolve(res);
            });
        }).catch(reject);
    });
}

async function generateResponseFromCache(query){
    const taggedCache = await caches.open('tagged');
    const keys = await taggedCache.keys();
    const responses = await Promise.all(keys.map(key=>taggedCache.match(key)));
    const responseTexts = await Promise.all(responses.map(r=>r.text()));
    console.log(responseTexts, 'in generate response from cache');
    const sortedByDist = responseTexts.map((text, i)=>({url :keys[i].url, dist : document_distance(text, query)})).sort((a,b)=>b.dist - a.dist).map(
        r=>r.url
    );
    return new Response(JSON.stringify(sortedByDist), {'Content-Type' : 'text/json'});
}

function document_distance(d1, d2){
    const vector = doc => doc.split(' ').reduce((obj, word)=>{
        if(word in obj) obj[word]++;
        else obj[word] = 1;
        return obj;
    }, {});
    const dot_prod = (v1, v2)=> Object.keys(v1).reduce((sum, key)=> sum+v1[key]*(v2[key] || 0), 0);
    const size = (x) => Object.values(vector(x)).reduce((sum, v)=>sum + v**2, 0)**0.5;
    return dot_prod(vector(d1), vector(d2))/(size(d1)*size(d2));
}

async function router(request){
    const routes = {
        'https?:\/\/.+\/search\/(.+)' : generateResponseFromCache,
    };
    const defaultRoute = async function(request){
        return caches.match(request).then(r=>r || new Response('404 not found :/', {status : 404, type : 'text/html'}));
    };
    for(let key in routes){
        let rex = new RegExp(key).exec(request.url);
        if(rex) console.log('match', rex);
        if(rex) return routes[key].apply(self, rex.slice(1));
    }
    return defaultRoute(request);
}