// start

'use strict';

// imports

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const express = require('express');
const bodyParser = require('body-parser');
const sleep = require('util').promisify(setTimeout);

// settings

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
var browser = {},
    page = {},
    content_search = [],
    content_choose = [],
    content_read = [];
app.use(express.static('public'));

// functions

async function starter() {

    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('https://kissmanga.com/', {
        timeout: 100000
    });
    await page.waitForNavigation({
        timeout: 100000,
        waitUntil: 'domcontentloaded'
    });
    return ('Connection Established!');

}

async function searcher(us) {

    const orgURL = await page.url();
    await page.waitFor('#keyword');
    await page.evaluate(typed => document.querySelector('#keyword').value = typed, us);
    while (orgURL == await page.url()) {
        await page.bringToFront();
        await page.click('#imgSearch');
        await page.bringToFront();
    }
    try {
        await page.waitFor('td');
    } catch (err) {
        return ['', 'Not Found... Disconnect and try again'];
    }
    const $ = cheerio.load(await page.content());
    content_search = $('td').map(function (index, item) {
        return [$(item).find('a').attr('href'), $(item).find('a').text()];
    }).get();
    content_search = content_search.filter(cleaner);

    function cleaner(v, i, a) {
        return i % 4 == 0 || i % 4 == 1;
    }
    return content_search;

}

async function selecter(us) {

    await page.goto('https://kissmanga.com/' + content_search[us], {
        waitUntil: 'domcontentloaded'
    });
    const $ = cheerio.load(await page.content());
    content_choose = $('td>a').map(function (index, item) {
        return [$(item).attr('href'), $(item).text()];
    }).get();
    return content_choose;

}

async function chooser(uc) {

    await page.goto('https://kissmanga.com/' + content_choose[uc], {
        waitUntil: 'domcontentloaded'
    });
    await page.waitFor('p>img');
    const $ = cheerio.load(await page.content());
    content_read = $('p>img').map(function (index, item) {
        return $(item).attr('src');
    }).get();
    console.log(content_choose[++uc]);
    return [content_choose[uc], content_read];

}

async function extractor(keys) {

    var result = [];
    for (var i = 0; i < keys.length; i++) {
        result.push(await chooser(keys[i] - 1));
        await sleep(1000);
    }
    return result;

}

async function ender() {

    await browser.close();
    return ('Disconnected!');

}

// routes

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/connect', async (req, res) => {
    res.send(await starter());
});

app.post('/search', async (req, res) => {
    res.send(await searcher(req.body.userSearch));
});

app.post('/select', async (req, res) => {
    res.send(await selecter(req.body.selection));
});

app.post('/read', async (req, res) => {
    res.send(await chooser(req.body.choice));
});

app.post('/download', async (req, res) => {
    res.send(await extractor(Object.keys(req.body)));
});

app.post('/disconnect', async (req, res) => {
    res.send(await ender());
});

app.listen(process.env.PORT || 3000);

// end