import json
import os
import time
from typing import List, Optional
from fastapi import FastAPI, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
import pymongo

client = pymongo.MongoClient("mongodb://ZianTT:1145141919810@localhost:27017/schedule")
db = client["schedule"]

app = FastAPI()

subject_name=  {
    '自': '自习',
    '物': '物理',
    '英': '英语',
    '化': '化学',
    '语': '语文',
    '劳': '劳技',
    '体': '体育',
    '数': '数学',
    '生': '生物',
    '地': '地理',
    '史': '历史',
    '政': '政治',
    '班': '班会',
    '心': '心理',
    '信': '信息',
    '艺': '艺术',
    '拓': '拓展',
    '锻': '体锻',
    '课': '课程',
    '无': '无课程'
}

timetable = {
    'ypgzgaoyi':{
        "workday": {
            '07:25-07:59': '早自习',
            '08:00-08:39': 0,
            '08:40-08:49': '课间',
            '08:50-09:29': 1,
            '09:30-09:39': '课间',
            '09:40-09:44': '眼保健操',
            '09:45-10:24': 2,
            '10:25-10:34': '课间',
            '10:35-11:14': 3,
            '11:15-11:24': '课间',
            '11:25-12:04': 4,
            '12:05-12:59': '午休',
            '13:00-13:39': '大活动',
            '13:40-14:19': 5,
            '14:20-14:29': '课间',
            '14:30-14:34': '眼保健操',
            '14:35-15:14': 6,
            '15:15-15:24': '课间',
            '15:25-16:04': 7,
            '16:05-16:14': '课间',
            '16:15-16:54': 8,
        },
        "friday": {
            '07:25-07:59': '早自习',
            '08:00-08:39': 0,
            '08:40-08:49': '课间',
            '08:50-09:29': 1,
            '09:30-09:39': '课间',
            '09:40-09:44': '眼保健操',
            '09:45-10:24': 2,
            '10:25-10:34': '课间',
            '10:35-11:14': 3,
            '11:15-11:24': '课间',
            '11:25-12:04': 4,
            '12:05-12:59': '午休',
            '13:00-13:39': '大活动',
            '13:40-14:19': 5,
            '14:20-14:29': '课间',
            '14:30-14:34': '眼保健操',
            '14:35-15:14': 6,
            '15:15-15:24': '课间',
            '15:25-16:04': 7,
        },
        "weekend": {
        }
    },
}

tiaoxiu = {
    '4/7': 5,
    '4/28': 5
}

@app.get("/")
def server():
    return {"time": time.time()}

# this is test api for admin panel, ignore it.

# from pydantic import BaseModel

# class LoginParam(BaseModel):
#     username: str
#     password: str


# @app.post("/api/login/account")
# def login(login:LoginParam):
#     return {"status": "ok", "type":"admin", "currentAuthority": "admin"}

# @app.get("/api/currentUser")
# def login():
#     return {"data": {"avatar": "ok", "access":"admin", "name": "admin"}}

@app.get("/api/exception")
def exception(id: str, date: str, index: int, subject: str|None = None):
    exceptions = db["exceptions"]
    if exceptions.count_documents({"id": id, "date": date}) == 0:
        if subject == None:
            return "no adding"
        exception: List[str|None] = [None,None,None,None,None,None,None,None,None]
        exception[index] = subject
        info = {"id": id, "date": date, "exceptions": exception}
        exceptions.insert_one(info)
    else:
        exist_exception = exceptions.find({"id": id, "date": date})
        for i in exist_exception:
            exception = i["exceptions"]
            exception[index] = subject
            if exception == [None,None,None,None,None,None,None,None,None]:
                exceptions.delete_one({"id": id, "date": date})
            exceptions.update_one({"id": id, "date": date}, {"$set": {"exceptions": exception}})
    return "ok"

@app.get("/api/announcement")
def announcement(id: str, info: str|None = None):
    announcement = db["announcement"]
    if announcement.count_documents({"id": id}) == 0:
        if info == None:
            return "no adding"
        announcement.insert_one({"id": id, "info": info})
    else:
        exist_announcement = announcement.find({"id": id})
        for i in exist_announcement:
            if info == None:
                announcement.delete_one({"id": id})
            announcement.update_one({"id": id}, {"$set": {"info": info}})
    return "ok"

@app.get("/api/config")
@app.get("/config")
def read_root(id: str = '', ver: str = '0.9.0'):
    daily_class = []
    license_name = None
    for i in db["config"].find({"_id": id}):
        license_name = i["license_name"]
        daily_class = i["object"]
    if license_name is not None:
        exceptions = {}
        for i in db["exceptions"].find({"id": id}):
            exceptions[i["date"]] = i["exceptions"]
        announcement = None
        for i in db["announcement"].find({"id": id}):
            announcement = i["info"]
        
        config = {
            "license_name": license_name,
            "weekIndex": ((time.time()-1708272000)//604800)%2,
            "subject_name": subject_name,
            "timetable": timetable['ypgzgaoyi'],
            "daily_class": daily_class,
            "exceptions": exceptions,
            "tiaoxiu": tiaoxiu,
            "announcement": announcement,
            "hitokoto_url": "https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=g&c=h&c=i",
            "websocket": True
        }
    else:
        config = {
            "subject_name": subject_name,
            "weekIndex": 0,
            "license_name": None,
            "timetable": {"workday": {'07:25-07:59': '早自习','08:00-08:39': 0,'08:40-08:49': '课间','08:50-09:29': 1,'09:30-09:39': '课间','09:40-09:44': '眼保健操','09:45-10:24': 2,'10:25-10:34': '课间','10:35-11:14': 3,'11:15-11:24': '课间','11:25-12:04': 4,'12:05-12:59': '午休','13:00-13:39': '大活动','13:40-14:19': 5,'14:20-14:29': '课间','14:30-14:34': '眼保健操','14:35-15:14': 6,'15:15-15:24': '课间','15:25-16:04': 7,'16:05-16:14': '课间','16:15-16:54': 8,},"friday": {'07:25-07:59': '早自习','08:00-08:39': 0,'08:40-08:49': '课间','08:50-09:29': 1,'09:30-09:39': '课间','09:40-09:44': '眼保健操','09:45-10:24': 2,'10:25-10:34': '课间','10:35-11:14': 3,'11:15-11:24': '课间','11:25-12:04': 4,'12:05-12:59': '午休','13:00-13:39': '大活动','13:40-14:19': 5,'14:20-14:29': '课间','14:30-14:34': '眼保健操','14:35-15:14': 6,},"weekend": {}},
            "daily_class": [
                {"Chinese": '周日',"classList": [],"timetable": 'weekend'},
                {"Chinese": '周一',"classList": ['课', '课', '课', '课', '课', '课', '课', '课', '课'],"timetable": 'workday'},
                {"Chinese": '周二',"classList": ['课', '课', '课', '课', '课', '课', '课', '课', '课'],"timetable": 'workday'},
                {"Chinese": '周三',"classList": ['课', '课', '课', '课', '课', '课', '课', '课', '课'],"timetable": 'workday'},
                {"Chinese": '周四',"classList": ['课', '课', '课', '课', '课', '课', '课', '课', '课'],"timetable": 'workday'},
                {"Chinese": '周五',"classList": ['课', '课', '课', '课', '课', '课', '课', '课'],"timetable": 'friday'},
                {"Chinese": '周六',"classList": [],"timetable": 'weekend'},
            ],
            "exceptions": {},
            "tiaoxiu": {},
            "announcement": "警告：当前未激活，请尽快激活。",
            "hitokoto_url": "https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=g&c=h&c=i",
            "websocket": False
        }
    if ver not in ["1.1.1"]:
        config["announcement"] = "提示：当前版本过低，程序理论上将自动更新。若您多次看到本提示，请联系维护人。当前最新版本1.1.1，您的版本"+ver+"。"
    return config

# /api/update give the content of ./update

@app.get("/api/update/{filename}")
def update(filename:str):
    if not os.path.exists("./update/"+filename):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse("./update/"+filename)
# websocket
from fastapi import WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[dict] = []

    async def connect(self, websocket: WebSocket, id: str):
        await websocket.accept()
        self.active_connections.append({"id": id, "websocket": websocket})

    def disconnect(self, websocket: WebSocket, id: str):
        self.active_connections.remove({"id": id, "websocket": websocket})

    async def send_personal_message(self, message: dict, id: str):
        for connection in self.active_connections:
            if connection["id"] == id:
                await connection["websocket"].send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection["websocket"].send_text(json.dumps(message))

manager = ConnectionManager()

@app.get("/refresh")
async def refreshConfig():
    await manager.broadcast({"type": "refresh"})
    return

@app.get("/alert")
async def alert(to: str, msg: str):
    await manager.send_personal_message({"type": "alert", "message": msg}, to)
    return

@app.get("/swconfig")
async def swconfig(to: str, data: str):
    data = json.loads(data)
    if to == "all":
        await manager.broadcast({"type": "swconfig", "configtype": data["type"], "value": data["value"]})
    else:
        await manager.send_personal_message({"type": "swconfig", "configtype": data["type"], "value": data["value"]}, to)
    return

manager = ConnectionManager()
@app.websocket("/api/ws/{id}")
async def websocket_endpoint(websocket: WebSocket, id: str):
    await manager.connect(websocket, id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, id)

