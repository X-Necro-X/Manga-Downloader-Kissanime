"use strict";
// imports

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const sleep = require('util').promisify(setTimeout);

// settings

const app = express();
app.set('view engine', 'ejs');
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
        waitUntil: "domcontentloaded"
    });

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
    await page.waitFor('td');
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
        waitUntil: "domcontentloaded"
    });
    const $ = cheerio.load(await page.content());
    content_choose = $('td>a').map(function (index, item) {
        return [$(item).attr('href'), $(item).text()];
    }).get();
    return content_choose;

}

async function chooser(uc) {

    await page.goto('https://kissmanga.com/' + content_choose[uc], {
        waitUntil: "domcontentloaded"
    });
    await page.waitFor('p>img');
    const $ = cheerio.load(await page.content());
    content_read = $('p>img').map(function (index, item) {
        return $(item).attr('src');
    }).get();
    return content_read;

}

async function extractor(keys) {

    var result = [];
    for (var i = 0; i < keys.length; i++) {
        result.push(await chooser(keys[i] - 1));
        await sleep(1000);
    }
    return result;

}

// routes

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/home', async (req, res) => {
    await starter();
    res.render('search');
});

app.post('/search', async (req, res) => {
    res.render('select', {
        result: await searcher(req.body.userSearch)
    });
});

app.get('/select/:selection', async (req, res) => {
    res.render('choose', {
        result: await selecter(req.params.selection)
    });
});

app.get('/choose/:choice', async (req, res) => {
    res.render('read', {
        result: await chooser(req.params.choice)
    });
});

app.get('/download', (req, res) => {
    res.render('download', {
        result: content_choose
    });
});

app.post('/download/selected', async (req, res) => {
    res.render('downloading', {
        result: await extractor(Object.keys(req.body))
    });
});

app.listen(3000);

// https://cors-anywhere.herokuapp.com/
// await browser.close();