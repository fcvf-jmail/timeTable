const axios = require('axios');
const { getISOWeek } = require('date-fns');

const updateChatId = async (id, chatId) => await axios.post("http://127.0.0.1:8000/api/user/", {id, chatId});

const getUser = async (chatId) => (await axios.get(`http://127.0.0.1:8000/api/user?chatId=${chatId}`)).data;

const getScheduele = async (subgroup_num, date_str) => (await axios.get(`http://127.0.0.1:8000/api/schedule?subgroup_num=${subgroup_num}&date_str=${date_str}`)).data

const getHomework = async (date, subject, subgroup = 0) => (await axios.get(`http://127.0.0.1:8000/api/homework?date=${date}&subject=${subject}&subgroup=${subgroup}`)).data

const getHomeworkById = async (id) => (await axios.get(`http://127.0.0.1:8000/api/homework?id=${id}`)).data

const addHomeWork = async (text, subject, date, subgroup = 0) => await axios.put("http://127.0.0.1:8000/api/homework/", {text, subject, date, subgroup})

const getHomeworks = async (subject, subgroup = 0) => (await axios.get(`http://127.0.0.1:8000/api/homeworks?subject=${subject}&subgroup=${subgroup}`)).data

function getDayHeader(inputDate) {
    const parts = inputDate.split('.');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day);

    const dayOfMonth = date.getDate();
    const russianMonths = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthName = russianMonths[date.getMonth()];
    const russianDays = ['Воскресенье', 'Понедельник', 'Вторник', 'среда', 'Четверг', 'Пятница', 'Суббота'];
    const dayOfWeek = russianDays[date.getDay()];

    const weekType = getISOWeek(date) % 2 === 0 ? 'нижняя' : 'верхняя';
    const formattedString = `${dayOfMonth} ${monthName} · ${dayOfWeek} · ${weekType}`;
    return formattedString;
}

module.exports = { updateChatId, getUser, getScheduele, getHomework, getHomeworkById, addHomeWork, getHomeworks, getDayHeader }