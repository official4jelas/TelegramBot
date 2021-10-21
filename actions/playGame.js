'use strict';

require('dotenv').config()

const { Markup } = require('telegraf');

const playGame = async (gameShortName, ctx, bot, games) => {
  const markup = Markup.inlineKeyboard([
    Markup.button.game('🎮 Play now!')
  ])

  const userId = ctx.update.message.from.id;

  ctx.replyWithGame('tetris', markup);

  bot.gameQuery(async (ctx) => {
    const gameData = games[gameShortName];

    let gameLink = `${gameData.link}?token=${
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

module.exports = playGame;
