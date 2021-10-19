'use strict';

const getGamesDetails = require('./getGames');
const knex = require('./db');

module.exports = {
  getGamesDetails,
  knex,
}