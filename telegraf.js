'use strict';
const Telegraf = require('telegraf');
const TELEGRAM_TOKEN='';
const bot = new Telegraf(TELEGRAM_TOKEN);
const sensor = require('ds18b20-raspi');
const helpers = require('./helpers');
const Markup = require('telegraf/markup');
const gpio = require('rpi-gpio');

const readTemperature = () => sensor.readSimpleC();
const startTracking = () => gpio.setup(23, gpio.DIR_IN, gpio.EDGE_BOTH);
const stopTracking = () => gpio.destroy();

gpio.on('change', async (channel, value) => {
  if (channel === 23 && value === true) {
    return helpers.takePicture()
      .then(fileName => helpers.postPhoto("get personal ID from what's my ID on telegram", fileName))
      .catch(e => console.log(e));
  }
});

bot.hears('ping', ctx => ctx.reply('pong'));

bot.hears('temp', ctx => ctx.reply(
  `the current temperature is ${readTemperature()}`));

bot.command('track', ({ reply }) =>
  reply('Track movement', Markup.inlineKeyboard([
    Markup.callbackButton('Start', 'start'),
    Markup.callbackButton('Stop', 'stop')
  ]).oneTime().extra()));

bot.action('start', (ctx, next) => {
  startTracking();
  return ctx.reply('tracking started').then(() => next())
});

bot.action('stop', (ctx, next) => {
  stopTracking();
  return ctx.reply('tracking stopped').then(() => next())
});

bot.command('photo', async ({ replyWithPhoto }) => {
  const source = await helpers.takePicture();
  return replyWithPhoto({ source });
});


bot.command('video', async ({ reply }) =>
  reply('Select video duration', Markup.inlineKeyboard([
    Markup.callbackButton('5 seconds', 'video5'),
    Markup.callbackButton('8 seconds', 'video8')
  ]).oneTime().extra()));

bot.action('video5', ctx => {
  helpers.sendVideoToChat(ctx, 5000);

});

bot.action('video8', async ctx => {
  try {
    await helpers.takeVideo(8000);
    const fileName = `${__dirname}/videos/video.mp4`;
    return ctx.replyWithVideo({source: fileName});
  } catch(e) {
    return ctx.reply('the video could not be taken this time');
  }
});

bot.launch({ polling: { timeout: 10, limit: 1,  allowedUpdates: null,  stopCallback: () => bot.stop() }});

