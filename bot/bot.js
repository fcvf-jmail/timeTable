const { Telegraf, Scenes, session, Markup } = require("telegraf")
const { updateChatId, getUser, getScheduele, getHomework, getDayHeader, getHomeworkById, getHomeworks } = require("./functions")
const { getFormattedDate, adjustDate, generateMonthCalendar, adjustMonth } = require("./dateFunctions")
const addHWScene = require("./addHWScene")
const { allSubjects, subjectsWithSubGroup } = require("./subjects")

const bot = new Telegraf("7207487785:AAHbUh7yyJY7ce4cnjfdPg-vQhy4VaatxK0")
const stage = new Scenes.Stage([addHWScene])

bot.use(session())
bot.use(stage.middleware())

async function mainMenuReplier(ctx) {
    if(ctx?.payload?.includes("id=")) await updateChatId(Number(ctx?.payload?.replace("id=", "")), ctx.from.id.toString())
    if(ctx?.payload?.includes("hw=")) {
        var homework = await getHomeworkById(ctx?.payload?.replace("hw=", ""))
        return await ctx.replyWithHTML(`<b>${homework.subject} · ${homework.date}</b>\n\n${homework.text}`).catch(err => console.log(err))
    }
    const user = await getUser(ctx.from.id)
    console.log(user)
    var keybaord = [[{text: "Расписание", callback_data: getFormattedDate()}], [{text: "Архив ДЗ", callback_data: "HWArchive"}]]
    if (user.isAdmin) keybaord.push([{text: "Добавить ДЗ", callback_data: "addHW"}])
    ctx.reply(`Привет, ${user.name}\nЧем я могу тебе помочь?`, {reply_markup: {inline_keyboard: keybaord}}).catch(err => console.log(err))
}

bot.start(async ctx => {
    await mainMenuReplier(ctx)
})

bot.action("backToMainMenu", async ctx => await mainMenuReplier(ctx))

// Любой день
bot.action(/^\d{2}\.\d{2}\.\d{4}$/, async ctx => {
    const lessonNumToTime = {1: "9:00 - 10:30", 2: "10:40 - 12:10", 3: "12:50 - 14:20", 4: "14:30 - 16:00", 5: "16:10 - 17:40", 6: "17:50 - 19:30", 7: "19:40 - 21:10", 8: "21:20 - 22:50"}
    const user = await getUser(ctx.from.id)
    const formattedDate = ctx.callbackQuery.data
    var scheduele = await getScheduele(user.subGroup, formattedDate)
    console.log(scheduele)
    var schedueleString = getDayHeader(formattedDate) + "\n\n"
    for (lesson of scheduele)
    {
        var lessonString = `<b>${lesson.lesson_num} · ${lessonNumToTime[lesson.lesson_num]} · ${lesson.lesson_type}</b>\n${lesson.subject}\n👨🏻‍🏫 ${lesson.teacher}\n🚪 ${lesson.room}`
        var homework = await getHomework(formattedDate, lesson.subject, lesson?.subgroup ?? 0)
        var homeworkString = homework.length == 0 ? "" : `\n📚 <a href="https://t.me/${(await ctx.telegram.getMe()).username}?start=hw=${homework.id}">ДЗ</a>`
        lessonString += homeworkString
        schedueleString += (lessonString + "\n\n")
    }
    var date = new Date()

    var sentMessage

    const reply_markup = {inline_keyboard: [[{text: "<", callback_data: adjustDate(formattedDate, -1)}, {text: formattedDate, callback_data: "s"}, {text: ">", callback_data: adjustDate(formattedDate, +1)}], [{text: "Календарь", callback_data: `${(date.getMonth() + 1).toString().padStart(2, 0)}.${date.getFullYear()}`}], [{text: "Назад", callback_data: "backToMainMenu"}]]}
    if(ctx.scene.session.messageIdToUpdate) sentMessage = await ctx.editMessageText(schedueleString, {reply_markup, parse_mode: "HTML"}).catch(err => console.log(err))
    else sentMessage = await ctx.replyWithHTML(schedueleString, {reply_markup}).catch(err => console.log(err))
    ctx.scene.session.messageIdToUpdate = sentMessage.message_id
})

// Календарь
bot.action(/^\d{2}\.\d{4}$/, async ctx => {
    var sentMessage
    var text = "Выберите день"
    var inline_keyboard = generateMonthCalendar(ctx.callbackQuery.data)
    if(ctx.scene.session.messageIdToUpdate) sentMessage = await ctx.editMessageText(`Выберите день`, inline_keyboard).catch(err => console.log(err))
    else sentMessage = await ctx.reply(`Выберите день`, inline_keyboard).catch(err => console.log(err))
    ctx.scene.session.messageIdToUpdate = sentMessage.message_id
});

bot.action("addHW", async ctx => {
    const user = await getUser(ctx.from.id)
    if(!user.isAdmin) return
    ctx.scene.enter("addHWScene")
})

bot.action("HWArchive", async ctx => {
    const subjectsInlineKeyboard = [...allSubjects.map(subject => {return [{text: subject, callback_data: `hw_${subject}`}]})]
    subjectsInlineKeyboard.push([{text: "Назад", callback_data: "backToMainMenu"}])
    ctx.reply("Архив дз, какого предмета ты хочешь посмотреть?", {reply_markup: {inline_keyboard: subjectsInlineKeyboard}}).catch(err => console.log(err))
})

bot.action(/hw_/ig, async ctx => {
    var subject = ctx.callbackQuery.data.replace("hw_", "")
    const subgroup = subjectsWithSubGroup.includes(subject) ? (await getUser(ctx.from.id)).subGroup : 0
    const homeworks = await getHomeworks(subject, subgroup)

    var textHtml = ""
    
    for (var homework of homeworks) textHtml += `📚 <a href="https://t.me/${(await ctx.telegram.getMe()).username}?start=hw=${homework.id}">${homework.date}</a>\n`
    
    if(textHtml.length == 0) textHtml = "По этому предмету нет ни одного дз"

    await ctx.replyWithHTML(textHtml, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "HWArchive"}]]}}).catch(err => console.log(err))
})

bot.launch().then(() => console.log("bot started"))