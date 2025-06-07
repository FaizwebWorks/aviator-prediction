import TelegramBot from "node-telegram-bot-api";
import { config } from "dotenv";
import fetch from "node-fetch";

config();

const token = process.env.TOKEN;
if (!token) {
  console.error("❌ ERROR: Please set your TOKEN in the .env file");
  process.exit(1);
}

// Function to clear webhook via Telegram API
async function clearWebhook(token) {
  const url = `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.ok) {
      console.log("✅ Webhook cleared");
    } else {
      console.log("⚠️ Failed to clear webhook:", data.description);
    }
  } catch (error) {
    console.error("❌ Error clearing webhook:", error);
  }
}

// Create bot instance without polling initially
const bot = new TelegramBot(token, { polling: false });

// Clear webhook then start polling
clearWebhook(token).then(() => {
  bot.startPolling();
  console.log("🚀 Bot started polling...");
});

// Variables and functions for prediction logic
let base = new Date().getSeconds();
let lastPrediction = 1.5 + (base % 25) / 10;

function getPrediction() {
  const trend = Math.random() > 0.5 ? 0.1 : -0.1;
  lastPrediction = Math.max(1.1, Math.min(4.0, lastPrediction + trend));
  return lastPrediction.toFixed(2);
}

// Subscribers list to send auto predictions
let subscribers = [];

// Bot commands and handlers
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Welcome to Aviator Predictor Bot!");
});

bot.onText(/\/predict/, (msg) => {
  const prediction = getPrediction();
  bot.sendMessage(msg.chat.id, `🎯 Predicted multiplier: ${prediction}x`);
});

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

// Log user chat IDs when any message is received
bot.on("message", (msg) => {
  console.log("Message from chat ID:", msg.chat.id);
});

// Periodically send auto predictions to subscribers every 60 seconds
setInterval(() => {
  if (subscribers.length === 0) return; // No need to run if no subscribers
  const prediction = getPrediction();
  subscribers.forEach((chatId) => {
    bot.sendMessage(chatId, `🤖 Auto Prediction: ${prediction}x`).catch((err) => {
      // Handle blocked users or errors gracefully
      console.log(`Failed to send message to ${chatId}:`, err.message);
    });
  });
}, 60000);
