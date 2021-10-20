'use strict';

require('dotenv').config()
const express = require("express");
const app = express();
const { getGamesDetails, knex } = require('./models');

const { Telegraf, Markup } = require('telegraf')

app.use(express.json());

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

bot.command('start', ctx => {
    console.log(ctx.from)
    bot.telegram.sendMessage(ctx.chat.id, 'Hello there! Welcome to my new telegram bot.', {
    })
})

const gamesList = [];
const gameChunks = [];
const getGamesData = async () => {
  const games = await getGamesDetails();
  const list = [];

  for (const game of games) {
    gamesList.push(game.full_name);
    list.push(game.full_name);
  }
  while (list.length) {
    gameChunks.push(list.splice(0, 2));
  }
}
getGamesData();

const showGameMarkup = async (gameShortName, ctx) => {
  const markup = Markup.inlineKeyboard([
    Markup.button.game('🎮 Play now!'),
    Markup.button.url('Telegraf help', 'http://telegraf.js.org')
  ])

  const userId = ctx.update.message.from.id;

  ctx.replyWithGame(gameShortName, markup);

  bot.gameQuery( async (ctx) => {

    const gameData = await knex('Disciplines')
      .select('link')
      .where('full_name', gameShortName);

    let gameLink = `${gameData[0].link}?token=${
      process.env.TELEGRAM_BOT_TOKEN
    }`
    let message = ctx.update.callback_query.message;
    gameLink = `${gameLink}&user_id=${
      userId
    }&message_id=${
      message.message_id
    }&chat_id=${message.chat.id}`
    ctx.answerGameQuery(gameLink);
  })
}

bot.hears('Join Channel', async(ctx) => {
  const telegramChannleLink = '';

  bot.telegram.sendMessage(ctx.chat.id, telegramChannleLink);
})

bot.hears('Get App & Win Cash', async (ctx) => {
  const championfyDownloadLink = 'https://www.championfy.com/';

  bot.telegram.sendMessage(ctx.chat.id, championfyDownloadLink);
})

bot.hears('Games', async (ctx) => {

  const text = 'Please select a game from below list';

  //constructor for providing games to the bot
  const requestGamesKeyboard = {
    "reply_markup": {
      "one_time_keyboard": true,
      "keyboard": gameChunks
    }
  };
  bot.telegram.sendMessage(ctx.chat.id, text, requestGamesKeyboard);
});

bot.hears('About us', async (ctx) => {
  const text = 'Add anything you want to tell about your app.';

  bot.telegram.sendMessage(ctx.chat.id, text);
})

bot.on('message', async (msg) => {
  const text = msg.update.message.text;
 
  if (gamesList.includes(text)) {
    await showGameMarkup(text, msg);
  } else {
    const homeKeyboard = {
      "reply_markup": {
        "one_time_keyboard": true,
        "keyboard": [
          [ 'Games','About us' ],
          [ 'Join Channel', 'Get App & Win Cash' ]
        ]
      } 
    };
    const messageForFalseCommand = `👀 Sorry friend! Didn't understand that one. \n\nCan you help a hamster 🐹 out and pick one of the options below 👇👇👇`;
    bot.telegram.sendMessage(
      msg.update.message.chat.id,
      messageForFalseCommand,
      homeKeyboard,
    );
  }
})

bot.launch();

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Express server is listening on ${port}`);
});
