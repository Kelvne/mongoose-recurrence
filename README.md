# mongoose-recurrence
A mongoose plugin for recurrent events using rrule.js

This is being developed along with an application which is using it. However, this is definitely not production ready. Yet.

## Todo
- README
- Examples
- Github Pages
- Set constants to not be dependent on rrule.js for use
- And a lot of things

## Use

`npm install --save mongoose-recurrence`

```javascript
const recurrence = require('mongoose-recurrence');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  date: Date,
  description: String,
});

EventSchema.plugin(recurrence));

const EventModel = mongoose.model('Event', EventSchema);
```

```javascript
const RRule = require('rrule').RRule;

let eventOne = new EventModel({
  date: new Date(),
  description: String,
});

eventOne = eventOne.addRecurrence({
  freq: RRule.MONTHLY,
});

/**
  eventOne.modifyOne()
  eventOne.modifyAll()
  eventOne.modifyForward()
  eventOne.getInPeriod()
  eventOne.deleteOne()
  eventOne.deleteForward()
*/

```
