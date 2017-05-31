const RRule = require('rrule').RRule;
const today = new Date();
const dateOne = new Date();
dateOne.setDate(10);
dateOne.setMonth(today.getMonth() - 1);
const dateTwo = new Date();
dateTwo.setDate(31);
dateTwo.setMonth(today.getMonth() - 1);
const dateThree = new Date();
dateThree.setDate(1);
dateThree.setMonth(today.getMonth() - 1);

module.exports = {
  BIMONTHLY: {
    freq: RRule.MONTHLY,
    interval: 2,
    count: 3,
  },
  MONTHLY: {
    freq: RRule.MONTHLY,
  },
  MONTHLYDTSTART: {
    freq: RRule.MONTHLY,
    dtstart: dateOne,
  },
  MONTHLYLASTDAY: {
    freq: RRule.MONTHLY,
    dtstart: dateTwo,
    count: 12,
  },
  WEEKLY: {
    freq: RRule.WEEKLY,
    dtstart: dateThree,
  },
  EXCEPTION: {
    date: dateTwo,
    updates: {
      description: 'Lero lero',
    },
  },
  dateOne,
  dateTwo,
};
