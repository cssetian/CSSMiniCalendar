var MiniCalendar = MiniCalendar || {};

MiniCalendar.App = (function() {
  'use strict';
  var self = {};


  self.init = function(options) {
    console.log('Initializing MiniCalendar App!');

    // Define calendar options for Chris's Calendar
    var options = {
      name: options.name,
      events: options.events,
      el: options.els.calendar
    }

    // Instantiate new Calendar object and initialize
    var cal = new MiniCalendar.Calendar();
    cal.init(options);

    console.log("MiniCalendar App For " + cal.name + " initialized!");
  };

  // Use closure with the app to hide private, more general page navigation functions from global namespace
  return { init: self.init };
})();

MiniCalendar.Calendar = function() {
  'use strict';
  var self = this;
  self.el = '';
  self.name = '';

  self.events = [];


};

MiniCalendar.Calendar.prototype.init = function(options) {
  'use strict';
  var self = this;
  console.log('Initializing Calendar!');

  self.el = options.el;
  self.name = options.name;

  _.each(options.events, function(event) {
    self.events.push(new MiniCalendar.Event(event));
  });

  self.calcGrid();
  self.drawGrid();

  console.log(self.name + " initialized!");
};
MiniCalendar.Calendar.prototype.calcGrid = function() {
  'use strict';
  var self = this;

  console.log('Calcing Grid!');
  _.each(self.eventsByStart(), function(eventGroup) {
    _.each(eventGroup, function(event) {
      console.log('Name: ' + event.name + '\tStart: ' + event.start + '\tEnd: ' + event.end);
    });
  });
};
MiniCalendar.Calendar.prototype.drawGrid = function() {
  'use strict';
  var self = this;

  console.log('Drew Grid on el ' + self.el + '!');
};
MiniCalendar.Calendar.prototype.eventsByStart = function() {
  'use strict';
  var self = this;

  return _.groupBy(self.events, 'start');
};
MiniCalendar.Calendar.prototype.eventsByEnd = function() {
  'use strict';
  var self = this;

  return _.groupBy(self.events, 'end');
};

MiniCalendar.Event = function(options) {
  'use strict';
  var self = this;

  self.name = options.name || 'Untitled Event';
  self.start = options.start || 0;
  self.end = options.end || 0;
};