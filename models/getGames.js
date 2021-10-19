const knex = require('./db');

const getGamesDetails = async () => {
  const gameDetails = await knex('Disciplines')
    .select('name', 'full_name')
    .where('discipline_type', 'MINI-GAMES')
    .where('orientation', 'PORTRAIT')
  return gameDetails;
}

module.exports = getGamesDetails;