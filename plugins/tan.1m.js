#!/usr/bin/env /usr/local/bin/node
require('dotenv').config({path: __dirname + '/../.env'});
const rp = require('request-promise');
const head = require('lodash/head');
const take = require('lodash/take');
const tail = require('lodash/tail');
const bitbar = require('bitbar');

var time = require('time')(Date);
var d = new Date();
d.setTimezone('Europe/Paris');

const GET_WAITING_TIME_PATH = 'http://open.tan.fr/ewp/tempsattente.json';

async function getTramTo(originCode, destination) {

    const options = {
        uri: `${GET_WAITING_TIME_PATH}/${originCode}`,
        json: true
    };

    return await rp(options)
        .then(function (stops) {
            const filteredByStops =  stops.reduce((result, stop) => {
                if(!result[stop.terminus]) {
                    result[stop.terminus] = [];
                }
                result[stop.terminus].push(stop);
                return result;
            });

            return filteredByStops[destination];
        }, {})
        .catch(function (err) {
            return null;
        });
}

const main = async () => {
    if(d.getHours() < 17 || d.getMinutes() < 45) {
        return bitbar([]);
    }

    const trams = take(await getTramTo(process.env.TAN_STOP_CODE, process.env.TAN_TERMINUS), 5);
    if(trams === null) {
        return bitbar([{text: ':light_rail: ...fail'}]);
    }

    bitbar([{
        text: ':light_rail: ' + head(trams).temps,
        dropdown: false
    },
    bitbar.sep,
    ...tail(trams)
        .map((tram) => ({
            text : tram.temps
        }))
    ]);
}

main();
