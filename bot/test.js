const { Telegraf, Scenes, session, Markup } = require("telegraf")
const bot = new Telegraf("7207487785:AAHbUh7yyJY7ce4cnjfdPg-vQhy4VaatxK0")

bot.start(ctx => ctx.reply("hello"))

bot.launch()