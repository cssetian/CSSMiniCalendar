var MiniCalendar = MiniCalendar || {};

MiniCalendar.App = function() {
  var self = this;
  self.cal = null;
  self.inputEls = {};

  self.init = function(options) {
    console.log('Initializing MiniCalendar App!');

    // Define calendar options for Chris's Calendar
    var calOptions = {
      name: options.name,
      events: options.events,
      el: options.els.calendar
    };

    // Instantiate new Calendar object and initialize
    self.cal = new MiniCalendar.Calendar(calOptions);

    self.inputEls = {
      name: options.els.eventName,
      start: options.els.eventStart,
      end: options.els.eventEnd,
      add: options.els.addEvent
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

        console.log('Added event ' + newEvent.name);
      } else {
        console.log('Please fill out all fields to create a new event!');
      }
    });
    console.log('MiniCalendar App For ' + self.cal.name + ' initialized!');
  };
};