#!/usr/bin/env node

const fetch = require("node-fetch");
const fs = require("fs");

const statusInterval = 5000;

const login = async (email, password) => {
  const res = await fetch("https://www.notion.so/api/v3/loginWithEmail", {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    method: "POST",
  });

  try {
    const token = res.headers
      .raw()
      ["set-cookie"].join("")
      .match(/token_v2=([0-9a-f]+);/)[1];
    return token;
  } catch (error) {
    console.log("Login failed", await res.json());
    process.exit(-1);
  }
};

const notionExport = async (token, spaceId, exportType) => {
  console.log(
    `Starting export in ${exportType}. SpaceId: ${spaceId.slice(0, 6)}...`
  );

  const task = {
    task: {
      eventName: "exportSpace",
      request: {
        spaceId,
        exportOptions: {
          exportType,
          timeZone: "Asia/Yekaterinburg",
          locale: "en",
        },
      },
    },
  };

  const res = await fetch("https://www.notion.so/api/v3/enqueueTask", {
    credentials: "include",
    headers: {
      Cookie: `token_v2=${token};`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
    method: "POST",
    mode: "cors",
  });

  const { taskId } = await res.json();
  console.log(`Waiting for export. Task: ${taskId.slice(0, 6)}...`);

  const exportURL = await new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const res = await fetch("https://www.notion.so/api/v3/getTasks", {
        headers: {
          Cookie: `token_v2=${token};`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskIds: [taskId] }),
        method: "POST",
      });

      const json = await res.json();
      const status = json.results[0].status;

      if (!status) {
        clearInterval(interval);
        reject(new Error(json));
      } else if (status.type == "progress") {
        console.log(`${status.pagesExported} pages exported`);
      } else if (status.type == "complete") {
        clearInterval(interval);
        console.log("Export done");
        resolve(status.exportURL);
      }
    }, statusInterval);
  });
  return exportURL;
};

const download = async (url) => {
  const res = await fetch(url);
  const dest = fs.createWriteStream(
    `./data/${url.match(/Export[0-9a-f-]+.zip/)[0]}`
  );
  res.body.pipe(dest);

  const size = res.headers.get("content-length");
  let recived = 0;
  let lastRecived = 0;
  res.body.on("data", (chunk) => {
    recived += chunk.length;
  });

  const interval = setInterval(() => {
    console.log(
      `Downloading ${(recived / 1048576).toFixed(1)}/${(size / 1048576).toFixed(
        1
      )} mb (${((recived / size) * 100).toFixed(1)}%) ${(
        ((recived - lastRecived) / 1048576 / (statusInterval / 1000)) *
        8
      ).toFixed(2)}mbps`
    );
    lastRecived = recived;
  }, statusInterval);

  await new Promise((r) => {
    res.body.on("end", r);
  });

  clearInterval(interval);
  console.log("done");
};

(async () => {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const exportType = process.env.EXPORT_TYPE || "both";

  const token = await login(email, password);
  console.log("Login successful");

  const res = await fetch("https://www.notion.so/api/v3/getSpaces", {
    headers: {
      Cookie: `token_v2=${token};`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    method: "POST",
  });
  const json = await res.json();
  for (const user in json) {
    for (const spaceId in json[user].space) {
      if (exportType === "both") {
        const mdUrl = await notionExport(token, spaceId, "markdown");
        await download(mdUrl);

        const htmlUrl = await notionExport(token, spaceId, "html");
        await download(htmlUrl);
      } else {
        const url = await notionExport(token, spaceId, exportType);
        await download(url);
      }
    }
  }
})();
