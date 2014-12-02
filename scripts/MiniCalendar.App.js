var MiniCalendar = MiniCalendar || {};

// Basic app that manages a rendered calendar and its associated user-inputs
MiniCalendar.App = function() {
  'use strict';
  var self = this;

  self.cal = {};
  self.appEls = {};
  self.calOptions = {};

  self.init = function(options) {
    console.log('Initializing MiniCalendar App!');

    // Define calendar options for Chris's Calendar
    self.calOptions = {
      name: options.name,
      jsonEvents: options.jsonEvents,
      els: {
        container: options.els.container,
        calendar: options.els.calendar,
        markers: options.els.markers
      }
    };

    // Instantiate new Calendar object and initialize
    self.cal = new MiniCalendar.Calendar(self.calOptions);

    self.appEls = {
      name: options.els.eventName,
      start: options.els.eventStart,
      end: options.els.eventEnd,
      add: options.els.addEvent,
      remove: options.els.removeEvent
    };

    $(self.appEls.add).on('click', self.addEvent);

    console.log('MiniCalendar App For ' + self.cal.name + ' initialized with the following settings!', self.calOptions);
  };

  self.addEvent = function() {
      console.log('Adding event!');
       
      if(
          $(self.appEls.name).val() !== '' &&
          $(self.appEls.start).val() !== '' &&
          $(self.appEls.end).val() !== ''
        ) {
        console.log('Adding event ' + self.appEls.name + ' to list');

        var newEventJSON = {
          name: $(self.appEls.name).val(),
          start: $(self.appEls.start).val(),
          end: $(self.appEls.end).val()
        };
        self.cal.addEvent(newEventJSON);
        
        $(self.appEls.remove).on('click', self.onRemove);
      } else {
        console.log('Please fill out all fields to create a new event!');
      }
  };

  self.onRemove = function(e) {
    var eventContainer = e.target.parentElement;
    var eventId = eventContainer.dataset.eventId;
    console.log('Removing event ' + eventId + '!');

    self.cal.removeEventById(eventId);
  };
};