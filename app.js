// imports

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");

// settings

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
var browser = {},
    page = {};

// functions

async function starter() {

    browser = await puppeteer.launch({
        headless: false
    });
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
    await page.type('#keyword', us);
    while (orgURL == await page.url()) {
        await page.bringToFront();
        await page.click('#imgSearch');
        await page.bringToFront();
    }
    await page.waitFor('td');
    const $ = cheerio.load(await page.content());
    var content = $('td>a').map(function () {
        return [$(this).attr('href'), $(this).text()];
    }).get();
    content = content.filter(cleaner);

    function cleaner(v, i, a) {
        return i % 4 == 0 || i % 4 == 1;
    }
    return content;

}

// routes

app.get('/', (req, res) => {
    res.render('home');
});

app.post('/home', async (req, res) => {
    await starter();
    res.render('search');
});

app.post('/search', async (req, res) => {
    res.render('select', {
        result: await searcher(req.body.userSearch)
    });
});

app.post('/select', (req, res) => {
    res.send(req.body.userSelect);
});

app.listen(3000);

// await browser.close();