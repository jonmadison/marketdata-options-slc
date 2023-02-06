#!env node

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;
const { slc, slcWithTargets } = require("../lib/slc");
const { option } = require("yargs");

yargs(hideBin(process.argv))
  .command("slc [symbol]", "start the server", (yargs) => {
    return yargs.positional("symbol", {
      describe: "ticker symbol",
      default: "SPY",
      require: true,
    });
  })
  .option("contract", {
    alias: "c",
    type: "string",
    description: "C/P",
  })
  .option("strike", {
    alias: "s",
    type: "number",
    description: "strike price",
  })
  .option("expiration", {
    alias: "e",
    type: "string",
    description: "expiration date YYMMDD",
  })
  .option("ratio", {
    alias: "r",
    type: "number",
    description: "risk to reward ratio",
  })

  .option("price", {
    type: "number",
  })
  .option("stop", {
    type: "number",
  })
  .option("target", {
    type: "number",
  })
  .option("debug", {
    type: "boolean",
  })
  .demandOption(["c", "s", "e"])
  .parse();

(async () => {
  // console.log(argv);
  if (!argv._[0]) {
    console.error(
      "I'll need the name of the ticker symbol as the first argument."
    );
    process.exit(1);
  }
  if (argv.price && argv.stop && argv.target) {
    console.error(
      `You already have price, stop and target, let me get you the option prices you need.`
    );
    try {
      let c = await slcWithTargets(
        argv._[0],
        argv.c || argv.contract,
        argv.e || argv.expiration,
        argv.s || argv.strike,
        argv.price,
        argv.stop,
        argv.target,
        argv.debug
      );
      console.log(JSON.stringify(c, null, 2));
    } catch (e) {
      console.error(`\n${e}\n`);
    }
  } else {
    try {
      let c = await slc(
        argv._[0],
        argv.c || argv.contract,
        argv.e || argv.expiration,
        argv.s || argv.strike,
        argv.r || argv.ratio,
        argv.debug
      );
      console.log(JSON.stringify(c, null, 2));
    } catch (e) {
      console.error(`\n${e}\n`);
    }
  }
})();
