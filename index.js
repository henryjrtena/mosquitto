const fs = require('fs')
const mqtt = require('mqtt')
const { connectOptions } = require('./use_mqtts.js')
const admin = require("firebase-admin");

// For Express
const express = require('express');
const app = express(port = 3000);
// End Express

const serviceAccount = require("./node-service-account.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
        "https://node-firebase-1e1af-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

const db = admin.database();

const clientId = 'server_' + Math.random().toString(16).substring(2, 8)
const options = {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'admin_henrii',
    password: 'adminadmin',
    reconnectPeriod: 1000,
    rejectUnauthorized: true,
}

const { protocol, host, ports } = connectOptions

let connectUrl = `${protocol}://${host}:${ports}`
if (['ws', 'wss'].includes(protocol)) {
    connectUrl += '/mqtt'
}

if (['mqtts', 'wss'].includes(protocol) && fs.existsSync('./emqxsl-ca.crt')) {
    options['ca'] = fs.readFileSync('./emqxsl-ca.crt')
}

const company_sensors = 'company_sensors'
const consumer_sensors = 'consumer_sensors'
const qos = 0

const client = mqtt.connect(connectUrl, options)
client.on('connect', () => {
    client.subscribe(company_sensors, { qos }, (error) => {
        if (error) return console.log('Subscribe error:', error)
        console.log(`${protocol}: Subcribed on '${company_sensors}'`)
    })
    client.subscribe(consumer_sensors, { qos }, (error) => {
        if (error) return console.log('Subscribe error:', error)
        console.log(`${protocol}: Subcribed on '${consumer_sensors}'`)
    })
})
client.on('reconnect', (error) => {
    console.log(`Reconnecting(${protocol}):`, error)
})

client.on('error', (error) => {
    console.log(`Cannot connect(${protocol}):`, error)
})

client.on('message', (topic, payload) => {
    const ref = db.ref(topic);
    // const data = JSON.parse(payload);
    const data = {
        "pH": Math.floor(Math.random() * 99) + 1,
        "turbidity": Math.floor(Math.random() * 99) + 1,
    };

    ref.set(data, (error) => {
        if (error == null) console.log('Succesfully saved.');

    });
})