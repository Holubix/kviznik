#!/usr/bin/env node
const readline = require("readline");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { initUserStore, createUser } = require("../src/users/store");

const ask = (query) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

(async () => {
  initUserStore();
  const username = process.argv[2] || (await ask("Username: "));
  const password = process.argv[3] || (await ask("Password: "));

  if (!username || !password) {
    console.error("Username and password are required.");
    process.exit(1);
  }

  createUser(username, password);
  console.log(`Created teacher account for ${username}.`);
})();