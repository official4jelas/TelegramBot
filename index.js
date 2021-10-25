'use strict';

require('dotenv').config()
const express = require("express");
const app = express();
const axios = require('axios')

const { Telegraf, Markup } = require('telegraf')

app.use(express.json());

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

const homeKeyboard = {
  "reply_markup": {
    "one_time_keyboard": true,
    "keyboard": [
      [  '▶ Games','💡 About us' ],
      [ '🤝 Join Channel', '🏆 Get App & Win Cash' ]
    ]
  } 
};

bot.command('start', ctx => {
  console.log(ctx);
  const text = 'Hello there! Welcome to championfy telegram bot, Please pick one of the options below'
  bot.telegram.sendMessage(ctx.chat.id, text, homeKeyboard)
})

const allowedGamesList = [
  'desert-road',
  'soccer-online',
  'jewel-block',
  'q-math',
];
const gameChunks = [];
const games = {};
let gamesDetails = [];

const getGames = async () => {
  const url = process.env.API_BASE_URL + 'games'
  const gameNamesList = []
  axios
  .get(url)
    .then((data) => {
      if (data) {
        gamesDetails = data.data;
        for (const gameDetails of gamesDetails) {
          if (allowedGamesList.includes(gameDetails.slug)) {
            gameNamesList.push(`🕹 ${gameDetails.name}`);
            games[`🕹 ${gameDetails.name}`] = gameDetails;
          }
        }
        while (gameNamesList.length) {
          gameChunks.push(gameNamesList.splice(0, 2));
        }
      }
    })
    .catch((error) => {
      if (error) {
        console.log(error)
      }
    })
}

getGames();


bot.hears('🤝 Join Channel', async(ctx) => {
  const telegramChannleLink = '';

  ctx.reply(telegramChannleLink);
})

bot.hears('🏆 Get App & Win Cash', async (ctx) => {
  const championfyDownloadLink = 'https://www.championfy.com/';

  ctx.reply(championfyDownloadLink);
})

bot.hears(['hi', 'hey', 'Hi', 'Hey'], async(ctx) => {
  console.log(ctx.from);
  const helloMessage = `Hello there ${ctx.from.first_name}! 👋🏻, Play Games and enjoy 👓, \n Here is some options you can try out`;

  ctx.reply(helloMessage, homeKeyboard);
})


bot.on('inline_query', async (ctx) => {

  const results = gamesDetails.map((game) => {
    return {
      type: 'game',
      id: game.uid,
      game_short_name: game.name
    }
  });


  ctx.answerInlineQuery(results);
})

bot.hears(['▶ Games', '▶ games'], async (ctx) => {

  const text = 'Please select a game from below list';

  //constructor for providing games to the bot
  const requestGamesKeyboard = {
    "reply_markup": {
      "one_time_keyboard": true,
      "keyboard": gameChunks
    }
  };
  ctx.reply(text, requestGamesKeyboard);
});

bot.hears('💡 About us', async (ctx) => {
  const text = 'Add anything you want to tell about your app.';

  ctx.reply(text);
})

bot.on('callback_query', (ctx) => {
  const callbackContext = ctx.callbackQuery

  const gameShortName = ctx.callbackQuery.game_short_name
  const gameData = games[gameShortName];
  let gameLink = `${gameData.link}?token=${
    process.env.TELEGRAM_BOT_TOKEN
  }`

  if (callbackContext.inline_message_id) {
    gameLink = `${gameLink}&user_id=${
      callbackContext.from.id
    }&inline_message_id=${
      callbackContext.inline_message_id
    }`
  } else {
    gameLink = `${gameLink}&user_id=${
      callbackContext.from.id
    }&message_id=${
      callbackContext.message.message_id
    }&chat_id=${callbackContext.message.chat.id}`
  }

  ctx.answerGameQuery(gameLink);
});

bot.on('message', async (ctx) => {
  const text = ctx.update.message.text; 
 
  if (games.hasOwnProperty(text)) {
    const markup = Markup.inlineKeyboard([
      Markup.button.game('🎮 Play now!'),
      Markup.button.url('Play with friends', 'https://telegram.me/ChampionfyGameBot?game=tetris')
    ])
    ctx.replyWithGame('tetris', markup);
  } else {
    const messageForFalseCommand = `👀 Sorry friend! Didn't understand that one. \n\nCan you help a hamster 🐹 out and pick one of the options below 👇👇👇`;
    bot.telegram.sendMessage(
      ctx.chat.id,
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
