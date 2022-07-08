document.onload = ()=>{
    if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./serviceWorker.js', {
        scope : './'
    });
    }
    else{
        alert('Your browser does not support offline search sadly :( . Can you update ?');
    }
}

document.querySelector('#search-form').addEventListener('submit', e => {
    e.preventDefault();
    const searchBarText = document.querySelector('#search').value;
    fetch('./search/'+searchBarText).then(r=>r.json()).then(links => writeSearchResultLinks(links));
});

function writeSearchResultLinks(links){
    const container = elt('section', {id : "search_results"});
    container.appendChild(elt('h2',{}, 'Search results'))
    for(let link of links)
      container.appendChild(elt('a', {href : link}, link));
    const existing = document.getElementById("search_results");
    existing.parentElement.replaceChild(container, existing);
}

// HELPER FUNCTIONS

function elt(name, attr, ...children){
    const el = document.createElement(name);
    for(let a in attr){
        el.setAttribute(a, attr[a]);
    }
    for(let child of children){
        if(typeof child==='string') el.appendChild(document.createTextNode(child));
        else el.appendChild(child);
    }
    return el;
}