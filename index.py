from bs4 import BeautifulSoup
from pydantic import BaseModel
import requests
from datetime import datetime
from fastapi import FastAPI, HTTPException, Response
import mysql.connector
from mysql.connector import Error
import re

def execute_query(query: str):
    connection = None
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='timeTable',
            user='durachok',
            password='durachok123'
        )
        cursor = connection.cursor()
        cursor.execute(query)
        result = cursor.fetchall()
        connection.commit()
        return result
    except Error as e:
        return e
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

app = FastAPI()
work_days_arr = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"]

def get_week(date_str = datetime.now().strftime("%d.%m.%Y")):
    date = datetime.strptime(date_str, "%d.%m.%Y")
    week_number = date.isocalendar()[1]
    return "нижняя" if week_number % 2 == 0 else "верхняя"


def get_day_title(date_str: str) -> str:
    date_obj = datetime.strptime(date_str, '%d.%m.%Y')
    day_of_week = date_obj.weekday()
    day_titles = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    return day_titles[day_of_week]


def get_schedule_html():
    data = {
        'fak': 'ФГиИБ',
        'kurs': '1',
        'grup': '2023-ФГиИБ-ИСиТ-2б'
    }
    response = requests.post('http://studydep.miigaik.ru/index.php', data=data)
    return response.content

def parse_schedule(schedule_html):
    soup = BeautifulSoup(schedule_html, 'html.parser')
    table = soup.find('table', class_='t')
    upper_week = {}
    lower_week = {}
    if not table:
        return (lower_week, upper_week)
    rows = table.find_all('tr')
    for row in rows:
        cells = row.find_all(['th', 'td'])
        row_data = [cell.text.strip() for cell in cells]
        row_with_day = any(day in row_data for day in work_days_arr)
        if row_with_day and len(row_data) > 3:
            day = row_data[0] 
            lesson = {
                "lesson_num": int(re.search(r'\d+', row_data[1]).group()),
                "subgroup": row_data[3],
                "subject": row_data[4],
                "teacher": row_data[5],
                "room": row_data[6],
                "lesson_type": row_data[7]
            }
            week = upper_week if "верхняя" in row_data else lower_week
            week.setdefault(day, []).append(lesson)
    return (lower_week, upper_week)

def get_subgroup_schedule(day_schedule, subgroup_number):
    subgroup_schedule = filter(lambda lesson: lesson["subgroup"] in [str(subgroup_number), ""], day_schedule)
    formatted_schedule = map(lambda lesson: {
        "lesson_num": lesson["lesson_num"], 
        "subject": lesson["subject"],
        "teacher": lesson["teacher"],
        "room": lesson["room"],
        "lesson_type": lesson["lesson_type"]
    }, subgroup_schedule)
    return formatted_schedule

@app.get("/api/schedule/")
async def get_schedule(subgroup_num: int, date_str: str = datetime.now().strftime("%d.%m.%Y")):
    day_title = get_day_title(date_str)
    print(day_title)
    if(day_title not in work_days_arr): return []
    schedule_html = get_schedule_html()
    (lower_week_schedule, upper_week_schedule) = parse_schedule(schedule_html)
    actual_week_schedule = upper_week_schedule if get_week(date_str) == "верхняя" else lower_week_schedule
    subgroup_day_schedule = get_subgroup_schedule(actual_week_schedule[day_title], subgroup_num)
    return list(subgroup_day_schedule)

class HomeworkCreate(BaseModel):
    text: str
    subject: str
    date: str
    subgroup: int = 0


@app.put("/api/homework/")
async def add_homework(homework_create: HomeworkCreate):
    try:
        res = execute_query(f'INSERT INTO `home works` (id, text, subject, date, subgroup) VALUES (NULL, "{homework_create.text}", "{homework_create.subject}", "{homework_create.date}", {homework_create.subgroup})')
        if(type(res) == mysql.connector.errors.ProgrammingError): raise res
        return 200
    except Error as e:
        return f"PUT /api/homework/\ndb error\n{e}"
    
@app.get("/api/homework/")
async def get_homework(subject: str = None, date: str = None, subgroup: int = 0, id: int = 0):
    try:
        query = f'SELECT * FROM `home works` WHERE subject = "{subject}" AND date = "{date}" AND subgroup = {subgroup}'
        if (id != 0): query = f'SELECT * FROM `home works` WHERE id = {id}'
        res = execute_query(query)
        if(type(res) == mysql.connector.errors.ProgrammingError): raise res
        return res if len(res) == 0 else dict(zip(["id", "text", "subject", "date", "subgroup"], res[0]))
    except Error as e:
        return f"GET /api/homework/\ndb error\n{e}"

class HomeworkUpdate(BaseModel):
    id: int
    new_text: str
    new_date: str

@app.post("/api/homework/")
async def edit_homework(homework_update: HomeworkUpdate):
    try:
        res = execute_query(f'UPDATE `home works` SET text = "{homework_update.new_text}", date = "{homework_update.new_date}" WHERE id = {homework_update.id}')
        if(type(res) == mysql.connector.errors.ProgrammingError): raise res
        return 200
    except Error as e:
        return f"POST /api/homework/\ndb error\n{e}"

@app.delete("/api/homework/")
async def delete_homework(id: int):
    try:
        res = execute_query(f'DELETE FROM `home works` WHERE id = {id}')
        if(type(res) == mysql.connector.errors.ProgrammingError): raise res
        return 200
    except Error as e:
        return f"DELETE /api/homework/\ndb error\n{e}"
    
@app.get("/api/homeworks/")
async def get_homework(subject: str, subgroup: int = 0):
    try:
        res = execute_query(f'SELECT * FROM `home works` WHERE subject = "{subject}" AND subgroup = {subgroup}')
        if(type(res) == mysql.connector.errors.ProgrammingError): raise res
        return res if len(res) == 0 else [dict(zip(["id", "text", "subject", "date", "subgroup"], row)) for row in res]
    except Error as e:
        return f"GET /api/homework/\ndb error\n{e}"
    
@app.get("/api/user")
async def get_user(chatId: str):
    try:
        res = execute_query(f'SELECT * FROM `users` WHERE chatId = {chatId}')
        keys = ["id", "chatId", "name", "surname", "gender", "subGroup", "isAdmin"]
        if(type(res) == mysql.connector.errors.ProgrammingError): raise res
        return res if len(res) == 0 else dict(zip(keys, res[0]))
    except Error as e:
        return f"GET /api/user/\ndb error\n{e}"
    

class UserUpdate(BaseModel):
    id: int
    chatId: str

@app.post("/api/user/")
async def update_user_chatId(user_update_info: UserUpdate):
    try:
        res = execute_query(f"UPDATE users SET chatId = '{user_update_info.chatId}' WHERE id = {user_update_info.id}")
        keys = ["id", "chatId", "name", "surname", "birthday", "gender", "subGroup", "login", "password", "isAdmin"]
        if(type(res) == mysql.connector.errors.ProgrammingError): raise res
        return 200
    except Error as e:
        return f"POST /api/user/\ndb error\n{e}"