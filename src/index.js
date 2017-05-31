const RRule = require('rrule').RRule;
const _ = require('lodash');

const today = require('./util/today.js');

function ocurrencesFromDates(dates, selfObject) {
  const ocurrences = _.map(dates, date => {
    const ocurrence = selfObject;
    ocurrence.referenceDate = date;

    return ocurrence;
  });

  return ocurrences;
}

module.exports = (schema, options = {}) => {
  const selfSchema = schema;

  const recurrencePath = options.path || 'recurrence';

  const recurrence = {
    [recurrencePath]: {
      rrule: {
        freq: Number,
        interval: Number,
        dtstart: Date,
        count: Number,
        until: Date,
        bymonthday: [Number],
        bysetpos: Number,
      },
      exceptions: [{
        refDate: Date,
        updates: {},
      }],
      exclude: { type: [Date], default: [] },
    }
  };

  selfSchema.add(recurrence);

  /**
   * Method add a recurrence in a document
   */
  selfSchema.methods.addRecurrence = function addRecurrence({ freq, dtstart, count, interval }) {
    const self = this;
    /**
     * freq is required
     */
    if (!freq) {
      // This should throw an error
      return self;
    } else {
      const documentRecurrence = {
        rrule: {
          freq,
          dtstart: dtstart || today,
        }
      };

      if (count) documentRecurrence.rrule.count = count;
      if (interval) documentRecurrence.rrule.interval = interval;

      self[recurrencePath] = Object.assign({}, self[recurrencePath], documentRecurrence);

      return self;
    }
  };

  /**
   * Method to return all occurrences of a finite recurrent event
   */
  selfSchema.methods.getAll = function getAll() {
    const self = this;
    if (self.recurrence.rrule.count || self.recurrence.rrule.until) {
      const selfObject = self.toObject();
      const recurrenceRule = new RRule(selfObject.recurrence.rrule);
      const dates = recurrenceRule.all();

      const ocurrences = _.map(dates, date => {
        const ocurrence = selfObject;
        ocurrence.referenceDate = date;

        return ocurrence;
      });

      return ocurrences;
    } else {
      return null;
    }
  };

  /**
   * Method to add exceptions to a recurrent event
   */
  selfSchema.methods.addException = function addException({ date, updates }) {
    const self = this;
    const exception = {
      refDate: date,
      updates,
    };

    const exceptionIndex = _.findIndex(self[recurrencePath].exceptions, e => e.refDate === date);

    if (exceptionIndex >= 0) {
      self[recurrencePath].exceptions[exceptionIndex] = exception;
    } else {
      self[recurrencePath].exceptions.push(exception);
    }

    return self;
  };

  /**
   * Clear every exception from a recurrent event
   */
  selfSchema.methods.clearExceptions = function clearExceptions() {
    const self = this;

    self.recurrence.exceptions = [];

    return self;
  };

  /**
   * Return all ocurrences at a given period
   */
  selfSchema.methods.getInPeriod = function getInPeriod(period) {
    const self = this;
    const selfObject = self.toObject();

    const recurrenceRule = new RRule(selfObject[recurrencePath].rrule);

    switch((Array.isArray(period) ? period.length : typeof period.getMonth)) {
      case 'function': {
        // Single Date

        /**
         * Set dates to get all days in a month
         */
        if (typeof period.getMonth !== 'function') {
          throw Error("Parameter Error: Invalid date.");
        }

        const startOfMonth = new Date(period);
        startOfMonth.setDate(1);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(startOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);

        const dates = recurrenceRule.between(startOfMonth, endOfMonth, true); // inc: true to get same, after and before

        const ocurrences = _.map(dates, date => {
          const ocurrence = Object.assign({}, selfObject);
          ocurrence.referenceDate = date;

          return ocurrence;
        });

        return ocurrences;
      }

      case 2: {
        // Array of 2 dates
        const dateOne = period[0];
        const dateTwo = period[1];

        const typeOfFirstDate = typeof dateOne.getMonth;
        const typeOfSecondDate = typeof dateTwo.getMonth;
        if (typeOfFirstDate !== 'function' && typeOfSecondDate !== 'function') {
          throw Error("Parameter Error: Invalid dates.");
        }

        const dates = recurrenceRule.between(period[0], period[1], true); // inc: true to get same, after and before

        const occurrences = _.map(dates, date => {
          const ocurrence = Object.assign({}, selfObject);
          ocurrence.referenceDate = date;

          return ocurrence;
        });

        return occurrences;
      }

      default:
        throw Error("Parameter Error: period must be an array of 2 dates or one single date");
    }
  };

  /**
   * Delete one occurrence
   */
  selfSchema.methods.deleteOne = function deleteOne(period) {
    const self = this;

    const excludedIndex = _.findIndex(self[recurrencePath].exclude, period);

    if (excludedIndex >= 0) self[recurrencePath].exclude[excludedIndex] = period;
    else self[recurrencePath].exclude.push(period);

    return self;
  };

  /**
   * Delete every occurrences from a given date
   */
  selfSchema.methods.deleteForward = function deleteForward(period) {
    const self = this;

    self[recurrencePath].rrule.until = period;

    return self;
  };

  /**
   * Modify one occurrence
   */
  selfSchema.methods.modifyOne = function modifyOne(period, updates) {
    const self = this;
    const selfModified = self.addException({
      date: period,
      updates,
    })

    return selfModified;
  };

  /**
   * Modify every occurrences
   */
  selfSchema.methods.modifyAll = function modifyAll(recurrence) {
    const self = this;
    let selfModified = self.clearExceptions();
    selfModified = self.addRecurrence(recurrence);

    return selfModified;
  };

  /**
   * Modify every occurrence from a given date
   */
  selfSchema.methods.modifyForward = function modifyForward(period, updates) {
    const self = this;
    const selfObject = self.toObject();
    const oldExceptions = selfObject[recurrencePath].exceptions;
    const recurrenceRule = new RRule(selfObject[recurrencePath].rrule);

    const toNewExceptions = recurrenceRule.between(selfObject[recurrencePath].rrule.dtstart, period, true);
    const newExceptions = _.map(toNewExceptions, date => {
      // exclude possible conflicts
      const newException = Object.assign({}, selfObject, updates);
      delete newException._id;
      // I expect to add later custom conflicts

      return {
        refDate: date,
        updates: newException,
      };
    });

    const filterOlder = _.filter(newExceptions, exception => !_.find(oldExceptions, e => e.refDate.getTime() === exception.refDate.getTime()))

    self[recurrencePath].exceptions = _.concat(oldExceptions, filterOlder);

    return self;
  };
};
