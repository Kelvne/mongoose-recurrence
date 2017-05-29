const expect = require('chai').expect;

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const eventSchema = require('./util/eventSchema.js');
const event = require('./util/mockEvent.js');
const recurrences = require('./util/mockRecurrences');

const eventModel = mongoose.model('event', eventSchema);

describe('Recurrence Simple Methods', () => {
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

  it('getAll should return null when the recurrence isnt finite', () => {
    const newRecurrentEvent = newEvent.addRecurrence(recurrences.MONTHLY);
    const occurrences = newRecurrentEvent.getAll();

    expect(occurrences).to.be.null;
  });

  it('getAll should return all the occurrences when the recurrence is finite', () => {
    const newRecurrentEvent = newEvent.addRecurrence(recurrences.MONTHLYLASTDAY);
    const occurrences = newRecurrentEvent.getAll();

    expect(occurrences).to.have.lengthOf(12);
    occurrences.forEach((ocurrence) => {
      expect(ocurrence).to.have.property('referenceDate');
    });
  });

  it('addException should add an valid exception to the recurrent document', done => {
    const newEventWithException = newEvent.addException(recurrences.EXCEPTION);

    newEventWithException.validate(err => {
      expect(err).to.be.null;
      const exceptions = newEventWithException.recurrence.exceptions;
      expect(exceptions).to.have.lengthOf(1);

      let validException = (exceptions[0].updates === recurrences.EXCEPTION.updates
        && exceptions[0].refDate === recurrences.EXCEPTION.date);

      expect(validException).to.be.eq(true);
      done();
    })
  });

  it('clearException should clear all the exceptions from a recurrent document', done => {
    const newEventWithException = newEvent.addException(recurrences.EXCEPTION);
    const newEventClearOfExceptions = newEventWithException.clearExceptions();

    newEventClearOfExceptions.validate(err => {
      expect(err).to.be.null;
      const exceptions = newEventClearOfExceptions.recurrence.exceptions;
      expect(exceptions).to.have.lengthOf(0);
      done();
    });
  });
});
