/*
* SELEZIONE RISPOSTA
* Mantengo una lista contentente tutte le risposte e l'id relativo alla domanda per controllare successivamente la personalità ottenuta
* Quando si sceglie una risposta, considero prima tutte le risposte alla data domanda come 'non scelte' 
* Successivamente, applico le modifiche specifiche alla risposta scelta
*
* Quando è stata scelta una risposta per ogni domanda, la lunghezza di chosenAnswers sarà pari a 3
* Quando ciò accade, creo e aggiungo un elemento html alla fine della pagina che contiene la personalità e il bottone per eseguire nuovamente il test
* Una volta determinata la personalità, rimuovo l'event listener da ogni risposta per impedire la selezione di altre risposte
*/

const answers = document.querySelectorAll('.choice-grid div');
const chosenAnswers = [];

/* Numero di domande del quiz */
const questionsAmount = countQuestions();

/* VARIABILI GLOBALI RELATIVE ALL'IMPLEMENTAZIONE DELL'API DI SPOTIFY */
const client_id = '374dc3c307c243b29a9e66e963737bf7';
const client_secret = 'd98cd851e1424df388eded5a977091e1';

let query;
let spotify_search;
const query_limit = 5;
let query_offset;

function selectAnswer(event){
    const thisDiv = event.currentTarget;
    const checkbox = thisDiv.querySelector('.checkbox');
    const choice = thisDiv.dataset.choiceId; /* stringa identificativa della personalità scelta */
    const idx = thisDiv.dataset.questionId; /* ID della domanda */

    if (thisDiv.dataset.spotifySearch)
        spotify_search = thisDiv.dataset.spotifySearch;

    for (let box of thisDiv.parentNode.querySelectorAll('div')){ /* Itero fra tutti i <div> della <section> relativa alla domanda, ovvero il contenitore (parent node) del div cliccato */
        /* Considero tutte le risposte 'non scelte' a priori, aggiornandone lo sfondo e impostando la checkbox unchecekd */
        box.querySelector('.checkbox').src = "./images/unchecked.png";
        box.classList.remove('chosen');
        box.classList.add('not-chosen');
    }

    /* Aggiornamento della checkbox e del colore di sfondo corrente */
    checkbox.src = "./images/checked.png";
    thisDiv.classList.remove('not-chosen');
    thisDiv.classList.add('chosen');

    /* Tolgo (se presenti) altre 'scelte' relative alla stessa domanda (necessario se si decide di scegliere nuovamente una risposta) */
        let i;
    for (i = 0; i < chosenAnswers.length; i++){

        if (chosenAnswers[i].id === idx){
            chosenAnswers.splice(i, 1);
            break; /* Se l'elemento esiste è unico, non serve iterare ancora */
        }
    }
    
    /* Aggiungo la risposta selezionata alla lista di risposte scelte */
    const temp = { 
        id: idx,
        choice: choice,
    }
    
    chosenAnswers.push(temp);

    if(chosenAnswers.length === questionsAmount){

        getPersonality();

        for (let box of answers){
            box.removeEventListener('click', selectAnswer);
            
        }
        
        window.scrollTo(0, document.body.scrollHeight);

    }

}

/* Aggiungo l'event listener sopra definito a ogni div di ogni choice grid */
for (let box of answers){
    box.addEventListener('click', selectAnswer);
    
}

/* 
* DETERMINAZIONE PERSONALITÀ
*/

function getPersonality(){

    /* Nella map 'occurrences' viene memorizzata una stringa rappresentante la personalità e il numero di occorrenze */
    const occurrences = {};
    let i;
    for (i = 0; i < chosenAnswers.length; i++){
        let type = chosenAnswers[i].choice;
        /* 
        * if necessario poichè, se si verifica la prima occorrenza di una personalità, è necessario assegnare 1 al valore a esso associata.
        * Non si può semplicemente sommare perchè il numero di occorrenze iniziali non è 0, bensì NaN
        */
        if (!occurrences[type])
            occurrences[type] = 1;
        else
            occurrences[type] += 1;
    }

    /* Selezione della personalità col massimo numero di occorrenze */
    let max = chosenAnswers[0].choice;
    for (let pers in occurrences){
        if (occurrences[pers] > occurrences[max])
            max = pers;
    }
    
    const article = document.querySelector('article');

    const container = document.createElement('div');
    
    const title = document.createElement('h2');
    title.textContent = RESULTS_MAP[max].title;
    
    const text = document.createElement('p');
    text.textContent = RESULTS_MAP[max].contents;
    
    const button = document.createElement('a');
    button.textContent = "Ricomincia il Quiz";
    button.href = "#"; /* Per tornare in cima alla pagina */

    /* CODICE RELATIVO ALL'IMPLEMENTAZIONE DELL'API DI SPOTIFY */
    const suggested = document.createElement('h2');
    suggested.textContent = 'Ecco degli album di ' + spotify_search;

    const album_container = document.createElement('div');
    album_container.id = 'album-container';

    const next_page = document.createElement('a');
    next_page.textContent = "Carica altri album";
    next_page.id = 'search-button'

    container.id = 'answer';
    title.id = 'answerTitle';
    text.id = 'answerDesc';
    button.id = 'resetButton';
    
    article.appendChild(container);
    container.appendChild(title);
    container.appendChild(text);
    container.appendChild(suggested);
    container.appendChild(album_container);
    container.appendChild(next_page)
    container.appendChild(button);

    /* Imposto il gestore della funzione di reset */
    button.addEventListener('click', reset);

    next_page.addEventListener('click', search)

    query = encodeURIComponent('artist:' + spotify_search);
    query_offset = 0;
    getAlbums();

}

function reset(event){
    for (let box of answers){
        box.addEventListener('click', selectAnswer);
        box.classList.remove('chosen', 'not-chosen');
        box.querySelector('.checkbox').src = "./images/unchecked.png";
    }

    event.currentTarget.parentNode.remove();

    chosenAnswers.splice(0,questionsAmount);

}

/* Funzione che conta il numero di domande del quiz */
function countQuestions(){
    let sections = document.querySelectorAll('.question-name');
    return(sections.length);
}

/* API SPOTIFY */
function getAlbums(){
    fetch('https://accounts.spotify.com/api/token', 
    {
        method: "post",
        body: 'grant_type=client_credentials',
        headers: {
            'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret),
            'Content-Type' : 'application/x-www-form-urlencoded'
        }
    }
).then(onTokenResponse).then(onTokenJson);
}


function onTokenResponse(token){
    return token.json();
}

function onTokenJson(json){
    fetch("https://api.spotify.com/v1/search?type=album&limit=" + query_limit + "&offset=" + query_offset + "&q=" + query,
    {
        headers:{
            'Authorization': 'Bearer ' + json.access_token,
        }
    }
    ).then(onResp).then(spotJson);
}

function onResp(response){
    return response.json();
}

function spotJson(json){
    const retrieved = json;
    const albums = document.querySelector('#album-container');

    const toShow = retrieved.albums.items;
    for (let item of toShow){

        const div = document.createElement('div');
        const img = document.createElement('img');
        const title = document.createElement('h3');
        div.classList.add('album-showcase');
        title.classList.add('album-title');

        albums.appendChild(div);
        div.appendChild(img);
        div.appendChild(title)

        img.src = item.images[1].url;
        title.textContent = item.name;
    }
    
}

function search(){
    query_offset += 5;
    document.querySelector('#album-container').innerHTML = '';
    getAlbums();
}

/* API SENZA OAUTH */

fetch("https://api.artic.edu/api/v1/artworks/search?q=tea&fields=image_id").then(onResp).then(artJson);

function artJson(json){
    const url_start = "https://www.artic.edu/iiif/2/"
    const url_end = "/full/843,/0/default.jpg";
    const pics = document.querySelectorAll('.art');
    console.log(json.data);
    for (let i = 0; i < 9; i ++){
        pics[i].src = url_start + json.data[i].image_id + url_end;
    }
}