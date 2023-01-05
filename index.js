require('dotenv').config();
const mongoose = require('mongoose');
const {Schema} = require('mongoose');
const {Client} = require('pg');

const matchConnection = mongoose.createConnection(
  'mongodb://localhost:27017/aram-matches'
);

const matchSchema = new Schema(
  {
    metadata: {
      dataVersion: String,
      matchId: { type: String, index: { unique: true } },
      participants: { type: [String], index: true },
    },
    info: {
      participants: [
        {
          puuid: { type: String, index: true },
          win: Boolean,
          pentaKills: Number,
          championName: String,
          summonerName: String,
        },
      ],
    },
  },
  { strict: false }
);

const Match = matchConnection.model('Match', matchSchema);

async function main () {
  await mongoose.connect('mongodb://localhost:27017/aram-matches');
  console.log('Connected to mongodb match database')
  const client = new Client();
  await client.connect();
  console.log('Connected to postgres database');

  const res = await client.query('TRUNCATE TABLE performance');
  console.log(res);

  for await (const doc of Match.find({})) {
    console.log(doc.metadata.matchId)
    const matchid = doc.metadata.matchId;
    for (participant of doc.info.participants) {
      const puuid = participant.puuid;
      const summonerName = participant.summonerName;
      const win = participant.win;
      const pentaKills = participant.pentaKills;
      const championName = participant.championName;
      const res = await client.query(`
        INSERT INTO performance (puuid, matchid, win, pentakills, champion, summonername)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [puuid, matchid, win, pentaKills, championName, summonerName])
    }
  }
}

main();