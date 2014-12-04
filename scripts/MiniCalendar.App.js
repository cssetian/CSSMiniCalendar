var MiniCalendar = MiniCalendar || {};

// Basic app that manages a rendered calendar and its associated actions
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
      els: {
        container: options.els.container,
        calendar: options.els.calendar,
        markers: options.els.markers,
        app: options.els.app
      }
    };
    if(options.jsonEvents) {
      self.calOptions.jsonEvents = options.jsonEvents;
    }

    self.clearApp();

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
    $(self.appEls.remove).on('click', self.onRemove);

    console.log('MiniCalendar App For ' + self.cal.name + ' initialized with the following settings!', self.calOptions);
  };

  // Clear the calendar container from the page
  self.clearApp = function() {
    var self = this;
    $(self.calOptions.els.app).html('');
  };

  // Add an event to the calendar (assuming it has been
  //        instantiated through a button or console call 
  //        to layOutDay) by reading from user inputs
  self.addEvent = function() {
    console.log('Adding event to calendar!');

    if($(self.appEls.start).val() === "" || $(self.appEls.end).val() === "" ) {
      alert('Please specify both a start and an end time!');
      return;
    }

    // Read input values
    var newEventJSON = {};
    if ($(self.appEls.name).val() !== '') { newEventJSON.name = $(self.appEls.name).val(); }
    if ($(self.appEls.start).val() !== '') { newEventJSON.start = parseInt($(self.appEls.start).val()); }
    if ($(self.appEls.end).val() !== '') { newEventJSON.end = parseInt($(self.appEls.end).val()); }
    if ($(self.appEls.location).val() !== '') { newEventJSON.location = $(self.appEls.location).val(); }

    // Add new element by recreating the calendar. 
    // Can probably be improved upon to require
    //      less rendering, i.e. just changing 
    //      specific event items that moved
    var currentEvents = self.cal.events;
    currentEvents.push(newEventJSON);

    var options = self.calOptions;
    options.jsonEvents = currentEvents;

    self.clearApp();
    self.cal = new MiniCalendar.Calendar(options);

    //self.cal.addEvent(newEventJSON);
    $(self.appEls.remove).on('click', self.onRemove);
  };

  // Remove an event from the calendar using its 'remove' button
  self.onRemove = function(e) {
    var eventContainer = e.target.parentElement;
    var eventId = eventContainer.dataset.eventId;

    var currentEvents = self.cal.events;
    var newEvents = _.filter(currentEvents, function(event) {
      return parseInt(event.id) !== parseInt(eventId);
    });
    
    var options = self.calOptions;
    options.jsonEvents = newEvents;

    self.clearApp();
    self.cal = new MiniCalendar.Calendar(options);

    $(self.appEls.remove).on('click', self.onRemove);
    console.log('Removed event ' + eventId + '!');
    //self.cal.removeEventById(eventId);
  };
};