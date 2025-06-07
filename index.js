const TelegramBot = require("node-telegram-bot-api");
const env = require("dotenv");

env.config();

// Replace with your token from @BotFather
const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: false });

bot
  .deleteWebhook()
  .then(() => {
    console.log("Webhook cleared, starting polling...");
    bot.startPolling();
  })
  .catch((err) => {
    console.error("Error clearing webhook:", err);
  });

// Start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Welcome to Aviator Predictor Bot!");
});

// Predict command
bot.onText(/\/predict/, (msg) => {
  const prediction = getPrediction();
  bot.sendMessage(msg.chat.id, `🎯 Predicted multiplier: ${prediction}x`);
});

bot.on("message", (msg) => {
  console.log("Your chat ID:", msg.chat.id);
});

let base = new Date().getSeconds();
let lastPrediction = 1.5 + (base % 25) / 10;
// let lastPrediction = 5.55

function getPrediction() {
  const trend = Math.random() > 0.5 ? 0.1 : -0.1;
  lastPrediction = Math.max(1.1, Math.min(4.0, lastPrediction + trend));
  return lastPrediction.toFixed(2);
}

let subscribers = [];
bot.onText(/\/subscribe/, (msg) => {
  const chatId = msg.chat.id;
  if (!subscribers.includes(chatId)) {
    subscribers.push(chatId);
    bot.sendMessage(chatId, "✅ Subscribed to auto predictions!");
  } else {
    bot.sendMessage(chatId, "ℹ️ You are already subscribed.");
  }
});

bot.onText(/\/unsubscribe/, (msg) => {
  const chatId = msg.chat.id;
  subscribers = subscribers.filter((id) => id !== chatId);
  bot.sendMessage(chatId, "❌ Unsubscribed from auto predictions.");
});

setInterval(() => {
  const prediction = getPrediction();
  subscribers.forEach((chatId) => {
    bot.sendMessage(chatId, `🤖 Auto Prediction: ${prediction}x`);
  });
}, 60000);

// console.log(getPrediction());

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `
Available Commands:
/start - Start the bot
/predict - Get current prediction
/subscribe - Get predictions every minute
/unsubscribe - Stop auto predictions
/help - List of commands

  `
  );
});
