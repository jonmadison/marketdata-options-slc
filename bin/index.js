#!env node

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;
const { slc } = require("../lib/slc");

yargs(hideBin(process.argv))
  .command("slc [symbol]", "start the server", (yargs) => {
    return yargs.positional("symbol", {
      describe: "ticker symbol",
      default: "SPY",
      require: true,
    });
  })
  .option("direction", {
    alias: "d",
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
  .demandOption(["d", "s", "e"])
  .parse();

(async () => {
  try {
    let c = await slc(argv._[0], argv.d, argv.e, argv.s, argv.r);
    console.log(JSON.stringify(c, null, 2));
  } catch (e) {
    console.error(`\n${e}\n`);
  }
})();
