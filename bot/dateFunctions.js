const { Markup } = require("telegraf")

function getFormattedDate(date = new Date()) {
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with zero if necessary
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (zero-based) and pad with zero if necessary
    const year = date.getFullYear(); // Get full year
    return `${day}.${month}.${year}`;
}

function adjustDate(formattedDate, daysToAddOrSubtract) {
    const [day, month, year] = formattedDate.split('.');
    const currentDate = new Date(year, month - 1, day);
    
    currentDate.setDate(currentDate.getDate() + daysToAddOrSubtract);
    
    const adjustedDay = currentDate.getDate();
    const adjustedMonth = currentDate.getMonth() + 1;
    const adjustedYear = currentDate.getFullYear();
    
    const adjustedFormattedDate = `${adjustedDay.toString().padStart(2, '0')}.${adjustedMonth.toString().padStart(2, '0')}.${adjustedYear}`;
    
    return adjustedFormattedDate;
}

function generateMonthCalendar(formattedDate = "01.01") {
    const [month, year] = formattedDate.split('.');
    const currentDate = new Date(year, month - 1, 1);

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0-воскресенье, 1-понедельник и т.д.
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const russianMonths = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const monthName = russianMonths[currentMonth];

    const inlineKeyboard = [];

    const previousMonth = adjustMonth(formattedDate, -1)
    const nextMonth = adjustMonth(formattedDate, +1)

    console.log(nextMonth)

    inlineKeyboard.push([
        Markup.button.callback('<', previousMonth),
        Markup.button.callback(monthName, 'ss'),
        Markup.button.callback('>', nextMonth)
    ])

    inlineKeyboard.push([
        Markup.button.callback('Пн', 'monday'),
        Markup.button.callback('Вт', 'tuesday'),
        Markup.button.callback('Ср', 'wednesday'),
        Markup.button.callback('Чт', 'thursday'),
        Markup.button.callback('Пт', 'friday'),
        Markup.button.callback('Сб', 'saturday'),
        Markup.button.callback('Вс', 'sunday')
    ]);

    let currentDay = 1;
    for (let row = 0; row < 5; row++) {
        let week = [];
        for (let col = 0; col < 7; col++) {
            if ((row == 0 && col < startDayOfWeek - 1) || currentDay > totalDays) week.push(Markup.button.callback(' ', 'empty'));
            else {
                week.push(Markup.button.callback(currentDay.toString(), `${currentDay.toString().padStart(2, 0)}.${formattedDate}`));
                currentDay++;
            }
        }
        inlineKeyboard.push(week);
    }
    
    var d = new Date()
    
    inlineKeyboard.push([Markup.button.callback("Назад", `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, 0)}.${d.getFullYear()}`)]);

    return Markup.inlineKeyboard(inlineKeyboard);
}

function adjustMonth(formattedDate, monthesToAddOrSubtract) {
    const [month, year] = formattedDate.split('.');
    const currentDate = new Date(year, month - 1, 1);
    
    currentDate.setMonth(currentDate.getMonth() + monthesToAddOrSubtract);
    
    const adjustedDay = currentDate.getDate();
    const adjustedMonth = currentDate.getMonth() + 1;
    const adjustedYear = currentDate.getFullYear();
    
    const adjustedFormattedDate = `${adjustedMonth.toString().padStart(2, '0')}.${adjustedYear}`;
    
    return adjustedFormattedDate;
}  


module.exports = { getFormattedDate, adjustDate, generateMonthCalendar, adjustMonth }