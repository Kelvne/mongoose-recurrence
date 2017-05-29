const RRule = require('rrule').RRule;
const _ = require('lodash');

const today = require('./util/today.js');

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
      exclude: [Date],
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
      return self;
    } else {
      const documentRecurrence = {
        rrule: {
          freq,
          dtstart: dtstart || today,
          bymonthday: [(dtstart || today).getDate()],
          bysetpos: -1,
        }
      };

      if (count) documentRecurrence.rrule.count = count;
      if (interval) documentRecurrence.rrule.interval = interval;

      self[recurrencePath] = documentRecurrence;

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
};
