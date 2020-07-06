const fs = require("fs");

const deleteOld = process.env.DELETE_OLD;

if (deleteOld) {
  const files = fs.readdirSync("./data");

  for (const file of files) {
    const stat = fs.statSync(`./data/${file}`);
    console.log(`${file} - ${stat.ctime}`);
    if ((Date.now() - stat.ctime) / 1000 / 60 / 60 / 24 > deleteOld) {
      fs.unlinkSync(`./data/${file}`);
      console.log("Delete");
    }
  }
}
