const mongoose = require('mongoose');
const mongooseRecurrence = require('../../index.js');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  date: Date,
  description: String,
});

eventSchema.plugin(mongooseRecurrence);

module.exports = eventSchema;