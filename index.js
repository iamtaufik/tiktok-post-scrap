const cheerio = require('cheerio');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
require('dotenv').config();
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox'],
  },
});

async function scrapAllPosts() {
  const baseUrl = process.env.BASE_URL;
  try {
    const result = await axios.get(baseUrl);
    const html = result.data;
    const $ = cheerio.load(html);
    const postsList = $('#main-content-others_homepage > div > div.tiktok-833rgq-DivShareLayoutMain.ee7zj8d4 > div.tiktok-1qb12g8-DivThreeColumnContainer.eegew6e2 > div > div');
    const postsTitle = $('#main-content-others_homepage > div > div.tiktok-833rgq-DivShareLayoutMain.ee7zj8d4 > div.tiktok-1qb12g8-DivThreeColumnContainer.eegew6e2 > div > div > div.tiktok-5lnynx-DivTagCardDesc.eih2qak1 > a');

    const thumbnails = $(
      '#main-content-others_homepage > div > div.tiktok-833rgq-DivShareLayoutMain.ee7zj8d4 > div.tiktok-1qb12g8-DivThreeColumnContainer.eegew6e2 > div > div > div.tiktok-x6f6za-DivContainer-StyledDivContainerV2.eq741c50 > div > div > a > div > div.tiktok-1jxhpnd-DivContainer.e1yey0rl0 > img'
    );
    const videosUrl = $(
      '#main-content-others_homepage > div > div.tiktok-833rgq-DivShareLayoutMain.ee7zj8d4 > div.tiktok-1qb12g8-DivThreeColumnContainer.eegew6e2 > div > div > div.tiktok-x6f6za-DivContainer-StyledDivContainerV2.eq741c50 > div > div > a'
    );
    const views = $(
      '#main-content-others_homepage > div > div.tiktok-833rgq-DivShareLayoutMain.ee7zj8d4 > div.tiktok-1qb12g8-DivThreeColumnContainer.eegew6e2 > div > div > div.tiktok-x6f6za-DivContainer-StyledDivContainerV2.eq741c50 > div > div > a > div > div.tiktok-11u47i-DivCardFooter.e148ts220 > strong'
    );

    let listItem = {
      createdAt: new Date(),
      posts: [],
    };
    let i = 0;
    postsList.each(function () {
      const title = $(postsTitle[i]).attr('title');
      const source = $(videosUrl[i]).attr('href');
      const thumbnail = $(thumbnails[i]).attr('src');
      const view = $(views[i]).text();

      listItem.posts.push({
        title,
        thumbnail,
        source,
        view,
      });
      i++;
    });
    return listItem;
  } catch (error) {
    console.log(error.message);
  }
}

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
  let title = '';
  const number = `${process.env.WHATSAPP_NUMBER}@c.us`;
  setInterval(async () => {
    const baseUrl = process.env.BASE_URL;
    try {
      const result = await axios.get(baseUrl);
      const html = result.data;
      const $ = cheerio.load(html);
      const postsTitle = $('#main-content-others_homepage > div > div.tiktok-833rgq-DivShareLayoutMain.ee7zj8d4 > div.tiktok-1qb12g8-DivThreeColumnContainer.eegew6e2 > div > div > div.tiktok-5lnynx-DivTagCardDesc.eih2qak1 > a')
        .first()
        .attr('title');
      if (title !== postsTitle) {
        client.sendMessage(number, 'ada post baru');
        client.sendMessage(number, postsTitle);
        title = postsTitle;
      }
    } catch (error) {
      client.sendMessage(number, error.message);
    }
  }, 30000);
});

client.on('message', async (msg) => {
  if (msg.body.startsWith('.scrap')) {
    msg.reply('Loading dulu..');
    const message = await scrapAllPosts();
    const templateMessage = `Create At ${message.createdAt}\n
    ${message.posts.map((post, index) => {
      return `*${index + 1}.* ${post.title}
      *•Thumbnail:* ${post.thumbnail}
      *•Source:* ${post.source}
      *•Views:* ${post.view}\n`;
    })}
    `;
    msg.reply(templateMessage.replace(',', ''));
  }
});

// (() => {

// })();

client.initialize();
