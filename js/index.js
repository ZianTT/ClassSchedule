var license = localStorage.getItem('license')
if (license === null) localStorage.setItem('license', '')
license = localStorage.getItem('license')
var version = '1.0.1'
var scheduleConfig;
$.ajax({
    type : "get",
    url : 'http://schedule.bitf1a5h.eu.org:8000/config?id='+license+'&ver='+version,
    async:false, 
    success : function(data){
        scheduleConfig=data;
    },
    error : function(){
        scheduleConfig = JSON.parse('{"subject_name":{"自":"自习","物":"物理","英":"英语","化":"化学","语":"语文","劳":"劳技","体":"体育","数":"数学","生":"生物","地":"地理","史":"历史","政":"政治","班":"班会","心":"心理","信":"信息","艺":"艺术","拓":"拓展","锻":"体锻","课":"默认课程"},"weekIndex":0,"license_name":null,"timetable":{"workday":{"07:25-07:59":"早自习","08:00-08:39":0,"08:40-08:49":"课间","08:50-09:29":1,"09:30-09:39":"课间","09:40-09:44":"眼保健操","09:45-10:24":2,"10:25-10:34":"课间","10:35-11:14":3,"11:15-11:24":"课间","11:25-12:04":4,"12:05-12:59":"午休","13:00-13:39":"大活动","13:40-14:19":5,"14:20-14:29":"课间","14:30-14:34":"眼保健操","14:35-15:14":6,"15:15-15:24":"课间","15:25-16:04":7,"16:05-16:14":"课间","16:15-16:54":8},"friday":{"07:25-07:59":"早自习","08:00-08:39":0,"08:40-08:49":"课间","08:50-09:29":1,"09:30-09:39":"课间","09:40-09:44":"眼保健操","09:45-10:24":2,"10:25-10:34":"课间","10:35-11:14":3,"11:15-11:24":"课间","11:25-12:04":4,"12:05-12:59":"午休","13:00-13:39":"大活动","13:40-14:19":5,"14:20-14:29":"课间","14:30-14:34":"眼保健操","14:35-15:14":6},"weekend":{}},"daily_class":[{"Chinese":"周日","English":"SUN","classList":[],"timetable":"weekend"},{"Chinese":"周一","English":"MON","classList":["课","课","课","课","课","课","课","课","课"],"timetable":"workday"},{"Chinese":"周二","English":"TUE","classList":["课","课","课","课","课","课","课","课","课"],"timetable":"workday"},{"Chinese":"周三","English":"WED","classList":["课","课","课","课","课","课","课","课","课"],"timetable":"workday"},{"Chinese":"周四","English":"THR","classList":["课","课","课","课","课","课","课","课","课"],"timetable":"workday"},{"Chinese":"周五","English":"FRI","classList":["课","课","课","课","课","课","课"],"timetable":"friday"},{"Chinese":"周六","English":"SAT","classList":[],"timetable":"weekend"}],"exceptions":{},"tiaoxiu":{},"announcement": "警告：当前为离线模式，请尽快联网"}')
    }
});

var weekIndex = scheduleConfig.weekIndex

var timeOffset = localStorage.getItem('timeOffset')
if (timeOffset === null) localStorage.setItem('timeOffset', '0')
timeOffset = Number(localStorage.getItem('timeOffset'))

function getCurrentEditedDate(){
    let d = new Date();
    d.setSeconds(d.getSeconds() + timeOffset)
    return d;
}

let date = getCurrentEditedDate()

let dateText = (date.getMonth()+1).toString()+'/'+date.getDate().toString()

let tiaoxiu_config = scheduleConfig.tiaoxiu[dateText];

// Generated by ChatGPT4 
function isBreakTime(startTime, endTime, currentTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const [currentH, currentM] = currentTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const currentMinutes = currentH * 60 + currentM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// Generated by ChatGPT4 
function getNextClassIndex(timetable, currentIndex) {
    // 从当前时间点的下一个时间段开始，找到下一个课程的索引
    const timeKeys = Object.keys(timetable);
    for (let i = currentIndex + 1; i < timeKeys.length; i++) {
        if (typeof timetable[timeKeys[i]] === 'number') {
            return timetable[timeKeys[i]];
        }
    }
    return null; // 如果没有下一堂课，返回 null
}

// Generated by ChatGPT4 
function getCurrentDaySchedule() {
    const date = getCurrentEditedDate();
    if(tiaoxiu_config) {
        dayOfWeek = tiaoxiu_config;
        originDayOfWeek = date.getDay();
    }
    else {
        dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    }
    const weekNumber = weekIndex; // 当前周数

    const dailyClass = scheduleConfig.daily_class[dayOfWeek];
    const exceptions = scheduleConfig.exceptions[dateText]
    if (!dailyClass) return [];

    let schedule = []
    for (let i = 0; i < dailyClass.classList.length; i++) {
        if (exceptions && exceptions[i]) {
            schedule.push('!'+exceptions[i])
            continue
        }
        if (Array.isArray(dailyClass.classList[i])) {
            schedule.push(dailyClass.classList[i][weekNumber])
        } else {
            schedule.push(dailyClass.classList[i])
        }
    }
    return schedule;
}

// Generated by ChatGPT4 
function isClassCurrent(startTime, endTime, currentTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const [currentH, currentM] = currentTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const currentMinutes = currentH * 60 + currentM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// Generated by ChatGPT4 
function getCurrentTime() {
    const now = getCurrentEditedDate();
    return [
        now.getHours().toString().padStart(2, '0'),
        now.getMinutes().toString().padStart(2, '0'),
        now.getSeconds().toString().padStart(2, '0')
    ].join(':');
}

// Generated by ChatGPT4 
function getScheduleData() {
    const currentSchedule = getCurrentDaySchedule();
    const currentTime = getCurrentTime();
    if(tiaoxiu_config) {
        dayOfWeek = tiaoxiu_config;
        originDayOfWeek = date.getDay();
    }
    else {
        dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    }
    const dayTimetable = scheduleConfig.timetable[scheduleConfig.daily_class[dayOfWeek].timetable];

    let scheduleArray = [];
    let currentHighlight = { index: null, type: null, fullName: null, countdown: null, countdownText: null };

    Object.keys(dayTimetable).forEach((timeRange, index) => {
        const [startTime, endTime] = timeRange.split('-');
        const classIndex = dayTimetable[timeRange];

        if (typeof classIndex === 'number') {
            subjectShortName = currentSchedule[classIndex];
            if(subjectShortName.startsWith('!')) {
                isException = true;
                subjectFullName = scheduleConfig.subject_name[subjectShortName.slice(1)]+'（换课）';
            }
            else{
                subjectFullName = scheduleConfig.subject_name[subjectShortName];
            }
            
            scheduleArray.push(subjectShortName);

            if (isClassCurrent(startTime, endTime, currentTime)) {
                currentHighlight.index = scheduleArray.length - 1;
                currentHighlight.type = 'current';
                currentHighlight.fullName = subjectFullName;
                currentHighlight.countdown = calculateCountdown(endTime, currentTime);
                currentHighlight.countdownText = formatCountdown(currentHighlight.countdown);
            }
        } else if (currentHighlight.index === null && isBreakTime(startTime, endTime, currentTime)) {
            let highlighted = false;
            for (let i = index + 1; i < Object.keys(dayTimetable).length; i++) {
                const nextTimeRange = Object.keys(dayTimetable)[i];
                const nextClassIndex = dayTimetable[nextTimeRange];
                if (typeof nextClassIndex === 'number') {
                    currentHighlight.index = scheduleArray.length;
                    currentHighlight.type = 'upcoming';
                    const nextSubjectShortName = currentSchedule[nextClassIndex];
                    const nextSubjectFullName = scheduleConfig.subject_name[nextSubjectShortName];
                    currentHighlight.fullName = dayTimetable[timeRange];
                    const [nextStartTime] = nextTimeRange.split('-');
                    currentHighlight.countdown = calculateCountdown(timeRange.split('-')[1], currentTime);
                    currentHighlight.countdownText = formatCountdown(currentHighlight.countdown);
                    highlighted = true;
                    break;
                }
            }
            if (!highlighted) {
                currentHighlight.index = currentSchedule.length - 1;
                currentHighlight.type = 'upcoming';
                currentHighlight.fullName = dayTimetable[timeRange];
                currentHighlight.countdown = calculateCountdown(timeRange.split('-')[1], currentTime);
                currentHighlight.countdownText = formatCountdown(currentHighlight.countdown);
                currentHighlight.isEnd = true;
            }
        } else if (currentHighlight.index === null && !dayTimetable[timeRange]) {
            // 当前时间是非课程时间（如课间休息）
            currentHighlight.fullName = currentSchedule[classIndex]; // 使用时间表中的描述
        }
    });

    return { scheduleArray, currentHighlight };
}


// Generated by ChatGPT4 
function calculateCountdown(targetTime, currentTime) {
    const [targetH, targetM] = targetTime.split(':').map(Number);
    const [currentH, currentM, currentS = '00'] = currentTime.split(':').map(Number);

    const targetTotalSeconds = targetH * 3600 + (targetM + 1) * 60;
    const currentTotalSeconds = currentH * 3600 + currentM * 60 + currentS;

    return targetTotalSeconds - currentTotalSeconds;
}

// Generated by ChatGPT4 
function formatCountdown(countdownSeconds) {
    const minutes = Math.floor(countdownSeconds / 60);
    const seconds = countdownSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

