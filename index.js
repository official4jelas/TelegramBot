require('dotenv').config()
const express = require("express");
const app = express();

const { Telegraf, Markup } = require('telegraf')

app.use(express.json());

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

bot.command('start', ctx => {
    console.log(ctx.from)
    bot.telegram.sendMessage(ctx.chat.id, 'hello there! Welcome to my new telegram bot.', {
    })
})

// const gameLink = "https://stg-cf-arcade-desert-road.appspot.com/"
// const gameShortName = "Desert Road";

// const markup = Markup.inlineKeyboard([
//   Markup.button.game('🎮 Play now!'),
//   Markup.button.url('Telegraf help', 'http://telegraf.js.org')
// ])

//method that displays the inline keyboard buttons 
bot.hears('animals', ctx => {
  console.log(ctx)
  let animalMessage = `great, here are pictures of animals you would love`;
  bot.telegram.sendMessage(ctx.chat.id, animalMessage, {
    reply_markup: {
      inline_keyboard: [
        [{
            text: "dog",
            callback_data: 'dog'
          },
          {
            text: "cat",
            callback_data: 'cat'
          }
        ],
      ]
    }
  })
})

bot.start((ctx) => ctx.reply('Welcome'))
// bot.help((ctx) => ctx.reply('Send me a sticker'))
// bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))

// bot.start((ctx) => ctx.replyWithGame(''))
// bot.command('foo', (ctx) => ctx.replyWithGame(gameShortName, markup))
// bot.gameQuery((ctx) => ctx.answerGameQuery(gameLink))

bot.launch()

port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Express server is listening on ${port}`);
});