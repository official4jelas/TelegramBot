'use strict';

require('dotenv').config()
const express = require("express");
const app = express();
const axios = require('axios')
const { playGame } = require('./actions');

const { Telegraf } = require('telegraf')

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
    const text = 'Hello there! Welcome to my new telegram bot, Please pick one of the options below'
    bot.telegram.sendMessage(ctx.chat.id, text, homeKeyboard)
})

const allowedGamesList = [
  'desert-road',
  'soccer-online',
  'jewel-block',
  'q-math',
];
const gameChunks = [];
const games = {}

const getGames = async () => {
  const url = process.env.API_BASE_URL + 'games'
  const gameNamesList = []
  axios
  .get(url)
    .then((data) => {
      if (data) {
        const gamesDetails = data.data;
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

  bot.telegram.sendMessage(ctx.chat.id, telegramChannleLink);
})

bot.hears('🏆 Get App & Win Cash', async (ctx) => {
  const championfyDownloadLink = 'https://www.championfy.com/';

  bot.telegram.sendMessage(ctx.chat.id, championfyDownloadLink);
})

bot.hears(['hi', 'hey', 'Hi', 'Hey'], async(ctx) => {
  const helloMessage = 'Hello there! 👋🏻, Play Games and enjoy 👓';

  bot.telegram.sendMessage(ctx.chat.id, helloMessage);
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
  bot.telegram.sendMessage(ctx.chat.id, text, requestGamesKeyboard);
});

bot.hears('💡 About us', async (ctx) => {
  const text = 'Add anything you want to tell about your app.';

  bot.telegram.sendMessage(ctx.chat.id, text);
})

bot.on('message', async (msg) => {
  const text = msg.update.message.text;
 
  if (games.hasOwnProperty(text)) {
    await playGame(text, msg, bot, games);
  } else {
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
