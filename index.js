const puppeteer = require('puppeteer');
const fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var app = express();
const path = require('path');
let url;


// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 
//form-urlencoded
app.get('/', async function(req, res){
  res.sendFile(path.join(__dirname, `/views/index.html`));
})
app.get('/component.css', async function(req, res){
  res.sendFile(path.join(__dirname, `/views/css/component.css`));
})

app.get('/cs-select.css', async function(req, res){
  res.sendFile(path.join(__dirname, `/views/css/cs-select.css`));
})

app.get('/cs-skin-boxes.css', async function(req, res){
  res.sendFile(path.join(__dirname, `/views/css/cs-skin-boxes.css`));
})

app.get('/demo.css', async function(req, res){
  res.sendFile(path.join(__dirname, `/views/css/demo.css`));
})

app.get('/normalize.css', async function(req, res){
  res.sendFile(path.join(__dirname, `/views/css/normalize.css`));
})



// for parsing multipart/form-data
app.use(upload.array()); 
app.use(express.static('public'));

app.post('/', async function(req, res){
  url = req.body.url;

  const urlcheck =  isValidUrl(url);
  if (urlcheck == true){
    res.redirect(302, '/article');
  } else {
    res.send("<h1>Invalid URL</h1>");
  }

});

app.get("/article", async function(req, res){
  const filename = await scrape(url)
  res.sendFile(path.join(__dirname, `/articles/${filename}`));
})
app.listen(3000, () => {
  console.log('App listening on port 3000!');
});

const isValidUrl = urlString=> {
  var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
  '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
return !!urlPattern.test(urlString);
}
  

async function scrape(url){
    console.log("Started scrape!")
    const browser = await puppeteer.launch({
      headless: true,
    });
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.goto(url);
  
    // Wait for the article content to load
    await page.waitForSelector('main');
  
    await autoScroll(page);
    const pretitle = await page.$eval('h1', el => el.innerText);
    const title = pretitle.replaceAll(" ", "-")
  
  
    const article = await page.content()
    const cleanArticle = article.replace(/<script[^>]*>([\s\S]*?)<\/script>/g, '');
    const cleanedArticle = cleanArticle.replace(/\n/g, '');
    fs.writeFile(`./articles/${title}.html`, cleanedArticle, (err) => {
      if (err) {
        return console.log(err);
      }
      
    })
  
  
    
  
  
    await context.close();
    await browser.close()
    return(`${title}.html`)
  }
  
  
  async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
  
          if (totalHeight >= scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }


