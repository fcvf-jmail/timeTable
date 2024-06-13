const { Scenes } = require("telegraf")
const { allSubjects, subjectsWithSubGroup } = require("./subjects")
const { addHomeWork } = require("./functions")

const subjectsInlineKeyboard = [...allSubjects.map(subject => {return [{text: subject, callback_data: subject}]})]

module.exports = new Scenes.WizardScene("addHWScene", 
    ctx => {
        ctx.reply("По какому предмету домашнее задание?", {reply_markup: {inline_keyboard: subjectsInlineKeyboard}}).catch(err => console.log(err))
        return ctx.wizard.next()
    },
    ctx => {
        if(!allSubjects.includes(ctx?.callbackQuery?.data)) return "Выбери одну из кнопок"
        ctx.scene.session.state.subject = ctx.callbackQuery.data
        if(subjectsWithSubGroup.includes(ctx.callbackQuery.data)) {
            ctx.reply("Выбери подгруппу", {reply_markup: {inline_keyboard: [[{text: "1", callback_data: "1"}, {text: "2", callback_data: "2"}]]}}).catch(err => console.log(err))
            return ctx.wizard.next()
        }
        ctx.scene.session.state.subgroup = 0
        ctx.reply("Введи текст дз").catch(err => console.log(err))
        return ctx.wizard.selectStep(ctx.wizard.cursor + 2)
    },
    ctx => {
        if(!["1", "2"].includes(ctx?.callbackQuery?.data)) return "Выбери одну из кнопок"
        ctx.scene.session.state.subgroup = Number(ctx.callbackQuery.data)
        ctx.reply("Введи текст дз").catch(err => console.log(err))
        return ctx.wizard.next()
    },
    ctx => {
        if(!ctx?.message?.text) return ctx.reply("Дай ответ текстом").catch(err => console.log(err))
        ctx.scene.session.state.text = ctx.message.text
        ctx.reply("Введи дату, на которую задали").catch(err => console.log(err))
        return ctx.wizard.next()
    },
    async ctx => {
        if(!ctx?.message?.text) return ctx.reply("Дай ответ текстом").catch(err => console.log(err))
        ctx.scene.session.state.date = ctx.message.text
        ctx.reply("Спасибо, добавил дз").catch(err => console.log(err))
        var { subject, subgroup, text, date } = ctx.scene.session.state
        addHomeWork(text, subject, date, subgroup)
        return ctx.scene.leave()
    }
)