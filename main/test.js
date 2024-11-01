const credentials = ["username", "password"]; //replace with your VSUEE credentials

const b = require("puppeteer");
const c = require("cheerio");

async function d() {
  const e = await b.launch({ headless: false });
  const f = await e.newPage();

  const g = "https://elearning.vsu.edu.ph/login/index.php";
  const h =
    "https://elearning.vsu.edu.ph/message/output/popup/notifications.php";

  const i = a[0];
  const j = a[1];

  await f.goto(g, { waitUntil: "networkidle2" });

  await f.type("#username", i);
  await f.type("#password", j);
  await f.click("#loginbtn");

  await f.waitForSelector("#nav-drawer", { timeout: 60000 });

  await f.goto(h, { waitUntil: "networkidle2" });

  const k = await f.evaluate(async () => {
    const l = document.querySelectorAll(".content-item-container.notification");
    let m = [];

    for (let n of l) {
      n.click();
      await new Promise((o) => setTimeout(o, 1000));

      const p = document.querySelector(".content-area .content").innerHTML;
      m.push(p);
    }

    return m;
  });

  await e.close();

  const q = k.map((r) => {
    const $ = c.load(r);
    const s = $("div.subject-container").text().trim();
    const t = $("tr.when td").text().trim();
    const u = $("td:contains('Course:')").text().trim();
    const v = $("th").text().trim();

    return `
Hi Boss,

You have upcoming activities due:

Activity event ${v}
When: ${t}
Course: ${u}
        `.trim();
  });

  return q;
}

d()
  .then((w) => {
    console.log("Scraped Notifications:");
    w.forEach((x) => console.log(x));
  })
  .catch(console.error);