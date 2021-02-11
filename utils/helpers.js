'use strict'

const moment = require('moment')

/**
 * Return number of hours between ISO 8601 dates
 * 
 * @param {*} isodate1 
 * @param {*} isodate2 
 */
exports.isodateHoursDiff = (isodate1, isodate2) => {
    var now = moment(isodate2) //todays date
    var end = moment(isodate1) // another date
    var duration = moment.duration(now.diff(end))
    return duration.asHours()
}