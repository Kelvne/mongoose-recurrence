const expect = require('chai').expect;

const RRule = require('rrule').RRule;
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const eventSchema = require('./util/eventSchema.js');
const event = require('./util/mockEvent.js');
const recurrences = require('./util/mockRecurrences');
const today = require('../src/util/today.js');

const eventModel = mongoose.model('event', eventSchema);

describe('Recurrence Attributes', () => {
  before(done => {
    mongoose.connect('mongodb://localhost/test')
    eventModel.find().remove(done);
  });

  after(done => {
    eventModel.find().remove(() => mongoose.connection.close(done));
  });

  it('should not interfer at creating a document without recurrence', done => {
    const newEvent = new eventModel(event);

    newEvent.validate(err => {
      expect(err).to.be.null;
      done();
    });
  });

  it('should have defaults attributes for when recurrent', done => {
    /**
     * Expecting the recurrent event to have properties:
     *  [bymonthday, dtstart, bysetpos: -1]
     */
    let newEvent = new eventModel(event);
    newEvent = newEvent.addRecurrence(recurrences.MONTHLY);

    newEvent.validate(err => {
      expect(err).to.be.null;
      const eventObject = newEvent.toObject();
      expect(eventObject).to.have.property('recurrence');
      expect(eventObject.recurrence).to.have.property('rrule');
      const rrule = eventObject.recurrence.rrule;
      expect(rrule).to.have.property('freq', RRule.MONTHLY);
      expect(rrule).to.deep.have.property('dtstart', today);
      expect(rrule).to.have.property('bysetpos', -1);
      done();
    });
  });

  it('should accept interval and parcel properties on the options parameter', done => {
    /**
     * Expect to have a rrule as the parameters are set
     * this should be a recurrent event every 2 months and to have 3 ocurrences (count = 3)
     */
    let newEvent = new eventModel(event);
    newEvent = newEvent.addRecurrence(recurrences.BIMONTHLY);

    newEvent.validate(err => {
      expect(err).to.be.null;
      const eventObject = newEvent.toObject();
      const rrule = eventObject.recurrence.rrule;
      expect(rrule).to.have.property('count', 3);
      expect(rrule).to.have.property('interval', 2);
      done();
    });
  });
});
