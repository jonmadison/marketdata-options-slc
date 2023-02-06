require("dotenv").config();
require("dotenv").config({ path: `${process.env.HOME}/.slcrc` });
const axios = require("axios");

const OPTIONS_URL = "https://api.marketdata.app/v1/options/quotes";

const optionsQuote = (symbol, direction, date, strike, debug = false) => {
  if (process.env.MARKETDATA_TOKEN === undefined)
    throw new Error(
      `You must add your MARKETDATA_TOKEN info to an ${process.env.HOME}/.slcrc file, an '.env' file in this directory, or pass it as an environment variable.`
    );
  let t = ticker(symbol, direction, date, strike);
  let url = `${OPTIONS_URL}/${t}`;
  if (debug) {
    console.error(`calling \n${url}`);
  }
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
  return {
    setOptionStopLossAt: Number(risk.toFixed(2)),
    setOptionTargetAt: Number(reward.toFixed(2)),
  };
};

ticker = (symbol, direction, date, strike) => {
  return `${symbol}${date}${direction}${`${strike}`.padStart(5, "0")}000`;
};

const optionsInfo = (q) => {
  return {
    price: {
      mid: q.mid[0],
      bid: q.bid[0],
      ask: q.ask[0],
    },
    oi: q.openInterest[0],
    vol: q.volume[0],
    greeks: {
      iv: q.iv[0],
      delta: q.delta[0],
      gamma: q.gamma[0],
      theta: q.theta[0],
      vega: q.vega[0],
    },
  };
};
const slcWithTargets = async (
  ticker,
  contract,
  expiration,
  strike,
  stockPrice,
  stockStopLoss,
  stockTarget,
  debug = false
) => {
  return new Promise(async (resolve, reject) => {
    let q = await optionsQuote(ticker, contract, expiration, strike, debug);
    let delta = q.delta[0];
    let lossDiff = Math.abs(stockPrice - stockStopLoss);
    let targetDiff = Math.abs(stockPrice - stockTarget);
    let optionLossDiff = delta * lossDiff;
    let optionTargetDiff = delta * targetDiff;
    let rr = {};
    rr.setOptionTargetAt = q.mid[0] + optionTargetDiff;
    rr.setOptionStopLossAt = q.mid[0] - optionLossDiff;
    rr.symbol = ticker;
    rr.stockCurrent = stockPrice;
    rr.stockTarget = stockTarget;
    rr.stockStop = stockStopLoss;
    rr.position = contract === "C" ? "call" : "put";

    rr.option = optionsInfo(q);
    resolve(rr);
  });
};

const slc = async (
  ticker,
  contract,
  date,
  strike,
  ratio = 0.333,
  debug = false
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let q = await optionsQuote(ticker, contract, date, strike, debug);
      //   console.log(`got options quote: ${JSON.stringify(q)}`);
      //   console.log(`mid: ${q.mid[0]}, delta: ${q.delta[0]}, ratio: ${ratio}}`);
      let rr = {};
      rr.symbol = ticker;
      rr.strike = strike;
      rr.position = contract === "C" ? "call" : "put";
      rr = {
        ...rr,
        ...calcRiskReward(q.mid[0], q.delta[0], ratio),
      };
      rr.option = optionsInfo(q);
      return resolve(rr);
    } catch (e) {
      return reject(e);
    }
  });
};

module.exports = {
  slc: slc,
  slcWithTargets: slcWithTargets,
};
