const expect = require('chai').expect;

const _ = require('lodash');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const eventSchema = require('./util/eventSchema.js');
const event = require('./util/mockEvent.js');
const recurrences = require('./util/mockRecurrences');

const eventModel = mongoose.model('event', eventSchema);

describe('getInPeriod method', () => {
  let newEvent;

  beforeEach(() => {
    newEvent = new eventModel(event);
  });

  afterEach(() => {
    newEvent = null;
  });

  before(done => {
    mongoose.connect('mongodb://localhost/test')
    eventModel.find().remove(done);
  });

  after(done => {
    eventModel.find().remove(() => mongoose.connection.close(done));
  });

  it('return all occurrences in a month period', () => {
    const newRecurrentDocument = newEvent.addRecurrence(recurrences.WEEKLY);
    const occurrences = newRecurrentDocument.getInPeriod(new Date());

    const dates = _.map(occurrences, occurrence => occurrence.referenceDate);

    expect(occurrences).to.have.lengthOf(4);
    // Real occurrences?
    occurrences.forEach(occurrence => {
      expect(occurrence).to.have.property('description');
      expect(occurrence).to.have.property('referenceDate');
    });
    // Dates must be different
    expect(dates).to.have.lengthOf(4);
    dates.forEach(date => {
      const allDates = _.reduce(dates, (sum, singleDate) => {
        return (date === singleDate ? sum + 1 : sum);
      }, 0);
      expect(allDates).to.be.eq(1);
    });
  });

  it('return all occurrences when a period is an array of dates', () => {
    const newRecurrentDocument = newEvent.addRecurrence(recurrences.WEEKLY);
    const todayDate = new Date();
    const todayPlusOneMonth = new Date();
    todayPlusOneMonth.setMonth(todayDate.getMonth() + 2);
    const occurrences = newRecurrentDocument.getInPeriod([todayDate, todayPlusOneMonth]);

    const dates = _.map(occurrences, occurrence => occurrence.referenceDate);

    expect(occurrences.length).to.be.oneOf([8, 9]);
    // Real occurrences?
    occurrences.forEach(occurrence => {
      expect(occurrence).to.have.property('description');
      expect(occurrence).to.have.property('referenceDate');
    });
    // Dates must be different
    expect(dates.length).to.be.oneOf([8, 9]);
    dates.forEach(date => {
      const allDates = _.reduce(dates, (sum, singleDate) => {
        return (date === singleDate ? sum + 1 : sum);
      }, 0);
      expect(allDates).to.be.eq(1);
    });
  });

  it('return only not excluded occurrences', () => {
    let newRecurrentDocument = newEvent.addRecurrence(recurrences.MONTHLYDTSTART);
    newRecurrentDocument = newRecurrentDocument.deleteOne(recurrences.dateOneToExclude);
    const toDate = new Date(recurrences.MONTHLYDTSTART.dtstart);
    toDate.setMonth(toDate.getMonth() + 2);

    const occurrences = newRecurrentDocument.getInPeriod([recurrences.MONTHLYDTSTART.dtstart, toDate]);

    const foundExcluded = _.findIndex(occurrences, (occurrence) => {
      return (occurrence.referenceDate.getTime() === recurrences.dateOneToExclude.getTime());
    });

    expect(foundExcluded).to.be.eq(-1);
  });
});
