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

  it('modify one occurrence', done => {
    let newRecurrentEvent = newEvent.addRecurrence(recurrences.WEEKLY);
    const periodToEdit = recurrences.WEEKLY.dtstart;
    periodToEdit.setDate(periodToEdit.getDate() + 7);

    newRecurrentEvent = newEvent.modifyOne(periodToEdit, {
      description: 'New description',
    });

    newRecurrentEvent.validate(err => {
      expect(err).to.be.null;

      const eventRecurrence = newRecurrentEvent.recurrence;

      expect(eventRecurrence.exceptions).to.have.lengthOf(1);
      expect(eventRecurrence.exceptions[0].refDate).to.be.eq(periodToEdit);
      expect(eventRecurrence.exceptions[0].updates.description).to.be.eq('New description');
      done();
    });
  });

  it('modify all occurrences', () => {
    let newRecurrentEvent = newEvent.addRecurrence(recurrences.WEEKLY);
    newRecurrentEvent = newRecurrentEvent.addException({
      date: new Date(),
      updates: {
        description: 'Lero lero',
      },
    });

    newRecurrentEvent.validate(err => {
      expect(err).to.be.null;
      newRecurrentEvent = newRecurrentEvent.modifyAll(recurrences.MONTHLY);

      const eventRecurrence = newRecurrentEvent.recurrence;

      expect(eventRecurrence.rrule.freq).to.be.eq(recurrences.MONTHLY.freq);
      expect(eventRecurrence.exceptions).to.have.lengthOf(0);
    });

  });

  it('modify all ocurrences from a given date', done => {
    let newRecurrentEvent = newEvent.addRecurrence(recurrences.WEEKLY);
    const periodToEdit = new Date(recurrences.WEEKLY.dtstart);
    periodToEdit.setDate(periodToEdit.getDate() + 7);

    const exceptionDescription = "This is lero lero";
    const newDescription = "What is lero lero?";

    newRecurrentEvent = newRecurrentEvent.addException({
      date: periodToEdit,
      updates: {
        description: exceptionDescription,
      },
    });

    periodToEdit.setDate(periodToEdit.getDate() + 7);

    newRecurrentEvent = newRecurrentEvent.modifyForward(periodToEdit, {
      description: newDescription,
    });

    newRecurrentEvent.validate(err => {
      expect(err).to.be.null;

      const eventRecurrence = newRecurrentEvent.recurrence;

      expect(eventRecurrence.exceptions).to.have.lengthOf(3);

      done();
    })
  });
});
