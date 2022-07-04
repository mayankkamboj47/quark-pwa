/**
 * offlineAssets : Things that will be precached when the service worker installs 
 * Note : This is not the same as 'when the app is installed'
 */
const offlineAssets = ['./', '/styles/index.css', './main.js'];
/* offline Docs are files the search engine will search from. 
Testing only. Soon, entire docs directory will be dynamically loaded. 
*/
const offlineDocs = ['./docs/1.md', './docs/2.md', './docs/3.md'];
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
                const tags = tagify(response);  // tagify is yet to be implemented.
                // do something with tags, like store them properly in indexedDB
                // before that, the project will probably be moved to workbox. 
                // or is it a good decision ? Time to git it. 
                return taggedCache.put(resource, response);
            });
        }));
    });
}
async function cacheFirst(request){
    const cacheRes = await caches.match(request);
    if(cacheRes) return cacheRes;
    const networkRes = await fetch(request);
    const networkResClone = networkRes.clone();
    caches.open('responses').then(responses=>{
        responses.put(request, networkResClone);
    });
    return networkRes;
}


/**
 * To fix : We need to somehow compare the two responses in cacheFinish.then, 
 * the 'r' and 'res' and cache the more fresh one. This will require checking the
 * response time data, if such a thing is available
 */
function cacheNetworkRace(request){
    return new Promise((resolve, reject)=>{
        const cacheFinish = caches.match(request).then(r=>{
            if(r) {
                resolve(r);
                return r;
            }
        }).catch(reject);
        fetch(request).then(res=>{
            caches.open('responses').then(responses=>{
                cacheFinish.then(r=>r ? null : responses.put(request, res.clone()));
                resolve(res);
            });
        }).catch(reject);
    });
}

function tagify(string){
    const tags = [];
    const ignore = {' ': true, '-' : true};
    for(let i=0;i<string.length;i++){
        if(string[i] in ignore) continue;
        else if(string[i]){
        }
    }
}