if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./serviceWorker.js', {
        scope : './'
    });
}
else{
    alert('Your browser does not support offline search sadly :( . Can you update ?');
}

document.querySelector('#search-form').addEventListener('submit', e => {
    e.preventDefault();
    const searchBarText = document.querySelector('#search').value;
    fetch('./'+searchBarText);
});