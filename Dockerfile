FROM nikolaik/python-nodejs:latest

WORKDIR /usr/src/timeTable

COPY ./ ./

RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /usr/src/timeTable/bot
RUN npm install

EXPOSE 8000

WORKDIR /usr/src/timeTable
CMD ["sh", "-c", "uvicorn index:app --host 0.0.0.0 --port 8000 & node bot/test.js"]
