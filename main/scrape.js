const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const credentials = ["username", "password"]; //replace with your VSUEE credentials

async function scrapeNotifications() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const loginUrl = "https://elearning.vsu.edu.ph/login/index.php";
  const notificationsUrl = "https://elearning.vsu.edu.ph/message/output/popup/notifications.php";

  const username = credentials[0];
  const password = credentials[1];

  await page.goto(loginUrl, { waitUntil: "networkidle2" });

  await page.type("#username", username);
  await page.type("#password", password);
  await page.click("#loginbtn");

  await page.waitForSelector("#nav-drawer", { timeout: 60000 });

  await page.goto(notificationsUrl, { waitUntil: "networkidle2" });

  const notifications = await page.evaluate(async () => {
    const items = document.querySelectorAll(".content-item-container.notification");
    let results = [];

    for (let item of items) {
      item.click();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const content = document.querySelector(".content-area .content").innerHTML;
      results.push(content);
    }

    return results;
  });

  await browser.close();

  const parsedNotifications = notifications.map((notification) => {
    const $ = cheerio.load(notification);
    const subject = $("div.subject-container").text().trim();
    const time = $("tr.when td").text().trim();
    const course = $("td:contains('Course:')").text().trim();
    const event = $("th").text().trim();

    return {
      message: `
Hi Boss,

You have upcoming activities due:

Activity event: ${event}
${time}
${course}
      `.trim(),
      date: time
    };
  });

  return parsedNotifications;
}

function logAtSpecificTime(notifications) {
  notifications.forEach((notification) => {
    const targetDate = parseNotificationDate(notification.date);
    const now = new Date();
    const delay = targetDate - now;

    if (delay > 0) {
      setTimeout(() => {
        console.log("Scraped Notifications:");
        console.log(notification.message);
      }, delay);
    } else {
      console.log("Target time has already passed for notification:", notification.message);
    }
  });
}

function parseNotificationDate(dateStr) {
  const dateParts = dateStr.split(',').map(part => part.trim());
  const dayOfWeek = dateParts[0];
  const datePart = dateParts[1]; 
  const timePart = dateParts[2];

  const activityDate = new Date(`${datePart} ${timePart}`);
  activityDate.setDate(activityDate.getDate() - 1); 
  activityDate.setHours(0, 0, 0, 0);

  return activityDate;
}

scrapeNotifications()
  .then((notifications) => {
    logAtSpecificTime(notifications);
  })
  .catch(console.error);
