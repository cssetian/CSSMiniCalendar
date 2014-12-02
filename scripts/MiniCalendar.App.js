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

    // Group all the els together responsible for various parts of page navigation
    self.appEls = {
      name: options.els.eventName,
      start: options.els.eventStart,
      end: options.els.eventEnd,
      location: options.els.eventLocation,
      add: options.els.addEvent,
      remove: options.els.removeEvent
    };

    $(self.appEls.add).on('click', self.addEvent);

    console.log('MiniCalendar App For ' + self.cal.name + ' initialized with the following settings!', self.calOptions);
  };

  self.addEvent = function() {
    console.log('Adding event to calendar!');

        var newEventJSON = {};
        if ($(self.appEls.name).val() !== '') { newEventJSON.name = $(self.appEls.name).val(); }
        if ($(self.appEls.start).val() !== '') { newEventJSON.start = $(self.appEls.start).val(); }
        if ($(self.appEls.end).val() !== '') { newEventJSON.end = $(self.appEls.end).val(); }
        if ($(self.appEls.location).val() !== '') { newEventJSON.location = $(self.appEls.location).val(); }

        self.cal.addEvent(newEventJSON);
        $(self.appEls.remove).on('click', self.onRemove);
  };

  self.onRemove = function(e) {
    var eventContainer = e.target.parentElement;
    var eventId = eventContainer.dataset.eventId;
    console.log('Removing event ' + eventId + '!');

    self.cal.removeEventById(eventId);
  };
};