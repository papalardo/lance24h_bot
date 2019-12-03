const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const axios = require("axios-https-proxy-fix");
// const axios = require('axios');

(async () => {
	// const proxy = {
	//     host: '131.100.148.147',
	//     port: 8080
	// }
	const listProxys = [
        { host: '34.90.113.143', port: 3128 },
        // { host: '51.158.68.68', port: 8811 },
		// { host: "43.229.72.249", port: 44291 },
		// { host: "154.127.120.18", port: 30280 },
		// { host: "200.255.122.174", port: 8080 },
		// { host: "187.44.167.78", port: 60786 },
		// { host: "138.204.23.81", port: 53281 },
		// { host: "200.178.251.146", port: 8080 },
		// { host: "189.84.210.214	", port: 3128 },
	];

	const getRandomProxy = () =>
		listProxys[Math.floor(Math.random() * listProxys.length)];

	const pageProxy = getRandomProxy();

	const browser = await puppeteer.launch({
		// headless: false,
		// devtools: true,
		args: [`--proxy-server=${pageProxy.host}:${pageProxy.port}`]
	});
	const page = await browser.newPage();

	  await page.goto('https://www.lance24h.com.br/Login.php', {waitUntil: 'networkidle2'});

	  await page.waitFor('input[id=Log_Email]');
	  await page.$eval('input[id=Log_Email]', el => el.value = 'papalardo');
	  await page.$eval('input[id=Log_Senha]', el => el.value = '@admin123');

	  await page.evaluate(() => {
	    document.querySelector('button[type=submit]').click();
	    document.querySelector('button[type=submit]').click();
	  });

	// const configGoTo = { waitUntil: "load", timeout: 0 }; // {waitUntil: 'networkidle2'}
	// await page.goto("https://www.lance24h.com.br", configGoTo);

	await page.waitFor(".BoxLeilao");

	const html = await page.content();
	const $ = cheerio.load(html);

	const idProducts = [];

	$(".BoxLeilao").map((index, element) => {
		if (element.attribs && element.attribs["id"]) {
			idProducts.push(element.attribs["id"].split("_").pop());
		}
	});

	const sleeper = ms => new Promise(resolve => setTimeout(() => resolve(), ms));

	const fisrtId = idProducts.shift();

	const removeLineBreaks = string => string.replace(/(\r\n|\n|\r|\\n)/gm, "");

	const getProductsLances = async () => {
		try {
            const proxy = getRandomProxy();
            
			const { data } = await axios.get(`https://www.lance24h.com.br/Req_Leiloes.php?Leiloes=_${fisrtId}`, { proxy });

			const timeRestante = removeLineBreaks(data[0] ? data[0].FaltaSegundos : 2);
            
            console.log('timeRestante ==>', timeRestante);
            
			if (data[0] && data[0].Status.includes('2') && timeRestante < 2) {
                console.log(data[0].Lances);
                console.log('ARREMETADO');
				await page.evaluate((fisrtId) => {
                    document.querySelector(`#L_BotaoA_${fisrtId} a`).click()
                }, fisrtId);
            }

            await sleeper(timeRestante * 1000 - 2000);
            getProductsLances();
		} catch (err) {
            console.warn("ERRO NO REQUEST ==> ", err);
            await sleeper(3000);
            getProductsLances();
		} 
	};

	getProductsLances();

	//   await page.screenshot({path: 'example.png'});

	//   await browser.close();
})();
