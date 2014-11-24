var MiniCalendar = MiniCalendar || {};

MiniCalendar.App = function() {
  'use strict';
  var self = this;

  self.cal = null;
  self.inputEls = {};

  self.init = function(options) {
    console.log('Initializing MiniCalendar App!');

    // Define calendar options for Chris's Calendar
    var calOptions = {
      name: options.name,
      events: options.events,
      els: {
        container: options.els.container,
        calendar: options.els.calendar,
        markers: options.els.markers
      }
    };

    // Instantiate new Calendar object and initialize
    self.cal = new MiniCalendar.Calendar(calOptions);

    self.calendarEls = {
      container: options.els.container,
      calendar: options.els.calendar,
      markers: options.els.markers
    };

    self.inputEls = {
      name: options.els.eventName,
      start: options.els.eventStart,
      end: options.els.eventEnd,
      add: options.els.addEvent,
      remove: options.els.removeEvent
    };

    $(self.inputEls.add).on('click', function() {
      console.log('Adding event!');
       
      if(
          $(self.inputEls.name).val() !== '' &&
          $(self.inputEls.start).val() !== '' &&
          $(self.inputEls.end).val() !== ''
        ) {
        console.log('Event ' + self.inputEls.name + ' found, adding to list');

        var newEvent = new MiniCalendar.Event({
          name: $(self.inputEls.name).val(),
          start: $(self.inputEls.start).val(),
          end: $(self.inputEls.end).val()
        });
        self.cal.addEvent(newEvent);
        $(self.inputEls.remove).on('click', self.onRemove);
      } else {
        console.log('Please fill out all fields to create a new event!');
      }
    });

    console.log('MiniCalendar App For ' + self.cal.name + ' initialized!');
  };

  self.onRemove = function(e) {
    var eventContainer = e.target.parentElement;
    //var eventChildren = eventContainer.children;
    var eventId = eventContainer.dataset.eventId;
    console.log('Removing event ' + eventId + '!');

    /*
    var childId = _.filter(eventChildren, function(child) { return child.event === ['event-id']; })[0];
    var childName = _.filter(eventChildren, function(child) { return child.classList === ['event-name']; })[0];
    var childStart = _.filter(eventChildren, function(child) { return child.classList === ['event-start']; })[0];
    var childEnd = _.filter(eventChildren, function(child) { return child.classList === ['event-end']; })[0];

    var eventToBeRemoved = new MiniCalendar.Event({
      id: childId,
      name: childName,  
      start: childStart,
      end: childEnd
    });
    */
    //self.cal.removeEvent(eventToBeRemoved);
    self.cal.removeEventById(eventId);
  };
};