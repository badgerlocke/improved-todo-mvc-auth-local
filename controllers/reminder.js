//Controlls automated reminders. Sends SMS message once per day to users with due items and reminders enabled.
const Todo = require('../models/Todo')
const Users = require('../models/User')
const cron = require('node-cron')
const { sendSMS } = require('./sms');

//Runs once per day at DAILY_REMINDER_TIME (UTC)
//For help changing cronStr: https://cron.help/#0_0_*_*_*
function sendDailyReminders() {
    let reminderTime = process.env.DAILY_REMINDER_TIME || 0
    let cronStr = `0 ${reminderTime} * * *`
    //cronStr = `* * * * *`  //FOR TESTING: Uncomment and this will try to send a text every minute.
    console.log('Reminder cron scheduled')
    cron.schedule(cronStr, () => {
        console.log('Reminders.....GO!')
        getReminders()
      });
}
sendDailyReminders()

//Get list of users who have reminders enabled
findUsersWithReminders = async () => {
    try {
        const userList = await Users.find({ reminders: true })
        return userList
    } catch(err) {
        console.log(err)
        return []
    }
}

//Get list of tasks due today (or in the past) for a specified user
findTasksDue = async (user) => {
    let today = new Date //NOTE: Times are UTC
    const todoItems = await Todo.find({userId: user,
        dueDate: {$lte: today}
    })
    return todoItems
}

//Find tasks due today for all users with reminders enabled, then send them a reminder message
getReminders = async () => {
    try {
        const userList = await findUsersWithReminders()
        // let tasks = []
        for (let user in userList) {
            // tasks[user] = await findTasksDue(usersToRemind[user]._id)
            let tasks = await findTasksDue(userList[user]._id)
            if (tasks.length > 0) {
                sendReminders(userList[user].userName,userList[user].phone,tasks)
            }  
        }
        // return tasks
    } catch (error) {
        console.log(error)
    }
}

//Send SMS reminder 
sendReminders = async (name,number,tasks) => {
    try {
        let message = `${name}, you have ${tasks.length} tasks to get done today.`
        console.log(message)
        sendSMS(number,message)
    } catch (error) {
        console.log(error)
    }
}
