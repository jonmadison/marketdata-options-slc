require("dotenv").config();
require("dotenv").config({ path: `${process.env.HOME}/.slcrc` });
const axios = require("axios");

const OPTIONS_URL = "https://api.marketdata.app/v1/options/quotes";

const optionsQuote = (symbol, direction, date, strike) => {
  if (process.env.MARKETDATA_TOKEN === undefined)
    throw new Error(
      `You must add your MARKETDATA_TOKEN info to an ${process.env.HOME}/.slcrc file, an '.env' file in this directory, or pass it as an environment variable.`
    );
  let t = ticker(symbol, direction, date, strike);
  let url = `${OPTIONS_URL}/${t}`;
  console.error(`calling \n${url}`);
  return new Promise(async (resolve, reject) => {
    const res = await axios.get(url, {
      //We can add more configurations in this object
      headers: {
        Authorization: `Token ${process.env.MARKETDATA_TOKEN}`,
      },
    });
    resolve(res.data);
  });
};

const calcRiskReward = (optionPrice, delta, ratio) => {
  let risk = optionPrice - Math.abs(delta);
  let reward = optionPrice * Math.round(1 / ratio);
  return { risk: risk.toFixed(2), reward: reward.toFixed(2) };
};

ticker = (symbol, direction, date, strike) => {
  return `${symbol}${date}${direction}${`${strike}`.padStart(5, "0")}000`;
};

const slc = async (ticker, direction, date, strike, ratio = 0.333) => {
  return new Promise(async (resolve, reject) => {
    try {
      let q = await optionsQuote(ticker, direction, date, strike);
      //   console.log(`got options quote: ${JSON.stringify(q)}`);
      //   console.log(`mid: ${q.mid[0]}, delta: ${q.delta[0]}, ratio: ${ratio}}`);
      let rr = {};
      rr.symbol = ticker;
      rr.strike = strike;
      rr.position = direction === "C" ? "call" : "put";
      rr.mid = q.mid[0];
      rr.bid = q.bid[0];
      rr.ask = q.ask[0];
      rr = { ...rr, ...calcRiskReward(q.mid[0], q.delta[0], ratio) };
      rr.ratio = ratio.toFixed(3);
      rr.delta = q.delta[0];

      return resolve(rr);
    } catch (e) {
      return reject(e);
    }
  });
};

module.exports = {
  slc: slc,
};
