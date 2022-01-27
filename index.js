'use strict';

require('dotenv').config()
const express = require("express");
const app = express();
const axios = require('axios')
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const { gameMessages } = require('./constant')
 
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express(),
    new Tracing.Integrations.Mysql(),
  ],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 0.1,
});

// RequestHandler creates a separate execution context using domains,
// so that every transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());


const { Telegraf, Markup } = require('telegraf')

app.use(express.json());

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)


app.get('/', (req, res) => {
  console.log('Hello');
  res.send('This is app is running on aws')
})

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
  const user = ctx.from;
  const text = 'Hello there! Welcome to championfy telegram bot, Please pick one of the options below'
  bot.telegram.sendMessage(ctx.chat.id, text, homeKeyboard)
})

bot.command('menu', ctx => {
  const text = 'Cool, Choose any from Below to start'
  bot.telegram.sendMessage(ctx.chat.id, text, homeKeyboard)
})

const allowedGamesList = [
  
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
        gameNamesList.push('⬅️ Back')
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
  const telegramChannleLink = 'https://t.me/playverz';

  ctx.reply(telegramChannleLink);
})

bot.hears('🏆 Get App & Win Cash', async (ctx) => {
  const championfyDownloadLink = 'https://www.championfy.com/';

  ctx.reply(championfyDownloadLink);
})

bot.hears(['hi', 'hey', 'Hi', 'Hey'], async(ctx) => {
  const helloMessage = `Hello there ${ctx.from.first_name}! 👋🏻, Play Games and enjoy 👓, \n Here is some options you can try out`;
  console.log(ctx.from)

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

bot.hears('⬅️ Back', (ctx) => {
  const text = 'Pick from the menu below 👇';

  ctx.reply(text, homeKeyboard);
})

bot.hears('💡 About us', async (ctx) => {
  const text = 'Championfy is the top Esports platform for casual mobile gamers.Gamers can join daily online. \n' +
  'Esports tournaments for their favourite skill-based mobile games, have fun and win rewards. \n' + 
  'Games on Championfy requires players to have Dexterity skills, Strategic Planning skills,' +
  'Observation skills, Problem Solving skills & More';

  ctx.reply(text);
})

bot.on('callback_query', (ctx) => {
  const callbackContext = ctx.callbackQuery
  let gameData;
  const gameShortName = ctx.callbackQuery.game_short_name
  for (const game in games) {
    if (games[game].short_name === gameShortName) {
      gameData = games[game];
      break;
    }
  }
  let gameLink = `${gameData.link}?token=${
    process.env.TELEGRAM_BOT_TOKEN
  }&play_again=true`
  const user = callbackContext.from

  if (callbackContext.inline_message_id) {
    gameLink = `${gameLink}&user_id=${
      user.id
    }&inline_message_id=${
      callbackContext.inline_message_id
    }`
  } else {
    gameLink = `${gameLink}&user_id=${
      user.id
    }&message_id=${
      callbackContext.message.message_id
    }&chat_id=${callbackContext.message.chat.id}`
  }

  ctx.answerGameQuery(gameLink);
});

bot.on('message', async (ctx) => {
  const text = ctx.update.message.text;
  if (games.hasOwnProperty(text)) {
    const gameShortName = games[text].short_name
    const markup = Markup.inlineKeyboard([
      Markup.button.game('🎮 Play now!'),
      Markup.button.url('Play with friends', `http://t.me/Championfy_Bot?game=${gameShortName}`)
    ])
    let message = gameMessages[Math.floor(Math.random() * gameMessages.length)]
    ctx.reply(message, homeKeyboard);
    ctx.replyWithGame(gameShortName, markup);
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
const ip = process.env.PUBLIC_AWS_IP_ADDRESS;

// The error handler must be before any other error middleware and
// after all controllers
app.use(Sentry.Handlers.errorHandler());

if (ip) {
  app.listen(port, ip, () => {
    console.log(`Express server is listening on ${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`Express server is listening on ${port}`);
  });
}
