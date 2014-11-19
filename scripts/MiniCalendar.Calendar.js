var MiniCalendar = MiniCalendar || {};

MiniCalendar.Calendar = function(userOptions) {
  var self = this;
  console.log('Initializing Calendar!');

  self.defaultOptions = {
    el: 'mini-calendar',
    name: 'Unititled Mini Calendar',
    events: []
  };
  self.mergedOptions = $.extend({}, self.defaultOptions, userOptions);

  self.el = self.mergedOptions.el;
  self.name = self.mergedOptions.name;

  self.events = [];
  _.each(self.mergedOptions.events, function(event) {
    self.events.push(new MiniCalendar.Event(event));
  });

  self.calcGrid();
  self.drawGrid();
  console.log(self.name + ' initialized!');
};

MiniCalendar.Calendar.prototype.addEvent = function(newEvent) {
  var self = this;
  
  if(_.contains(self.events, newEvent)) {
    console.log('Event already present in events list!');
    return;
  }

  self.events.push(newEvent);
  self.calcGrid();
  self.drawGrid();
};
MiniCalendar.Calendar.prototype.calcGrid = function() {
  var self = this;
  console.log('Recalculating Grid Params!');

  _.each(self.eventsByStart(), function(eventGroup) {
    _.each(eventGroup, function(event) {
      console.log('Name: ' + event.name + '\tStart: ' + event.start + '\tEnd: ' + event.end);
    });
  });

  console.log('Recalculated Grid Params!');
};
MiniCalendar.Calendar.prototype.clearGrid = function() {
  var self = this;
  console.log('Clearing Grid on el: ' + self.el);

  var myNode = document.getElementById(self.el);
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }

  console.log('Cleared Grid on el: ' + self.el);
};
MiniCalendar.Calendar.prototype.drawGrid = function() {
  var self = this;
  console.log('Drawing Grid on el: ' + self.el);
  
  var calendarContainer = $(self.el);
  calendarContainer.html('');

  _.each(self.events, function(event){
    console.log('Drawing Event Name: ' + event.name + '\tStart: ' + event.start + '\tEnd: ' + event.end);
    var newEventWidget = self.createWidget(event);
    calendarContainer.append(newEventWidget);
  });

  console.log('Drew Grid on el: ' + self.el);
};
MiniCalendar.Calendar.prototype.createWidget = function(event) {

  var divEventContainer = document.createElement('div');
  divEventContainer.classList.add('event-container');

  var divEventTitle = document.createElement('div');
  divEventTitle.classList.add('event-title');
  var textEventTitle = document.createTextNode(event.name);
  divEventTitle.appendChild(textEventTitle);

  var divEventStart = document.createElement('div');
  divEventStart.classList.add('event-start');
  var textEventStart = document.createTextNode(event.start);
  divEventStart.appendChild(textEventStart);

  var divEventEnd = document.createElement('div');
  divEventEnd.classList.add('event-end');
  var textEventEnd = document.createTextNode(event.end);
  divEventEnd.appendChild(textEventEnd);

  var divEventTimeContainer = document.createElement('div');
  divEventTimeContainer.classList.add('event-time-container');
  var textTimeSeparator = document.createTextNode(' - ');
  divEventTimeContainer.appendChild(divEventStart);
  divEventTimeContainer.appendChild(textTimeSeparator);
  divEventTimeContainer.appendChild(divEventEnd);

  divEventContainer.appendChild(divEventTitle);
  divEventContainer.appendChild(divEventTimeContainer);

  return divEventContainer;
};

MiniCalendar.Calendar.prototype.eventsByStart = function() {
  var self = this;
  return _.groupBy(self.events, 'start');
};
MiniCalendar.Calendar.prototype.eventsByEnd = function() {
  var self = this;
  return _.groupBy(self.events, 'end');
};
