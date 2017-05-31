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

  it('exclude one occurence when deleteOne is called with a valid date', () => {
    let newRecurrentEvent = newEvent.addRecurrence(recurrences.WEEKLY);
    const dateToExclude = recurrences.WEEKLY.dtstart;
    dateToExclude.setDate(dateToExclude.getDate() + 14);

    newRecurrentEvent = newRecurrentEvent.deleteOne(dateToExclude);

    newRecurrentEvent.validate(err => {
      expect(err).to.be.null;

      const eventRecurrence = newRecurrentEvent.recurrence;

      expect(eventRecurrence).to.have.property('exclude');
      expect(eventRecurrence.exclude).to.have.lengthOf(1);
      expect(eventRecurrence.exclude[0]).to.be.eq(dateToExclude);
    });

  });

  it('exclude all occurrences from a given date', () => {
    // What does this mean?
    // It means we are going to set an "until" field on the recurrence attribute
    let newRecurrentEvent = newEvent.addRecurrence(recurrences.WEEKLY);
    const dateToExclude = recurrences.WEEKLY.dtstart;
    dateToExclude.setDate(dateToExclude.getDate() + 14);

    newRecurrentEvent = newRecurrentEvent.deleteForward(dateToExclude);

    newRecurrentEvent.validate(err => {
      expect(err).to.be.null;

      const eventRecurrence = newRecurrentEvent.recurrence;
      expect(eventRecurrence.rrule.until).to.be.eq(dateToExclude);
    });
  });
});
