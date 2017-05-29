const expect = require('chai').expect;

const RRule = require('rrule').RRule;
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const eventSchema = require('./util/eventSchema.js');
const event = require('./util/mockEvent.js');
const recurrences = require('./util/mockRecurrences');
const today = require('../src/util/today.js');

const eventModel = mongoose.model('event', eventSchema);

describe('Advanced Recurrence Options', () => {
  before(done => {
    mongoose.connect('mongodb://localhost/test')
    eventModel.find().remove(done);
  });

  after(done => {
    eventModel.find().remove(() => mongoose.connection.close(done));
  });

  it('should expect last day of the month to be standard when not set advanced options', done => {
    let newEvent = new eventModel(event);
    newEvent = newEvent.addRecurrence(recurrences);
    done();
  });
});
