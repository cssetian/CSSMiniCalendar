var MiniCalendar = MiniCalendar || {};

// Day-Planning Calendar app that manages a calendar with 
//      a collection of events that are rendered in a grid
//      without overlapping
MiniCalendar.Calendar = function(userOptions) {
  'use strict';
  var self = this;
  console.log('Initializing Calendar!');

  self.defaultOptions = {
    els: {
      calendar: '#calendar-events',
      markers: '#container-markers',
      app: '#calendar-app'
    },
    name: 'Unititled Mini Calendar',
    containerHeight: 720,
    containerWidth: 620,
    startTime: 9 * 60,
    endTime: (9 + 12) * 60,
    jsonEvents: [
      { start: 0, end: 60 },
      { start: 180, end: 240 },
      { start: 100, end: 180 },
      { start: 60, end: 120 },
      { start: 200, end: 300, name: 'Wacky Event' }
    ]
  };
  self.mergedOptions = $.extend(true, self.defaultOptions, userOptions);

  self.els = self.mergedOptions.els;

  self.currentEventId = 0;
  self.nextEventId = function() { return self.currentEventId++; };

  self.name = self.mergedOptions.name;
  self.calendarStartTime = parseInt(self.mergedOptions.startTime);
  self.calendarEndTime = parseInt(self.mergedOptions.endTime);

  // Initialize user-defined events that are passed in JSON as MiniCalendar.Event objects
  self.mappedEvents = [];
  self.events = _.map(self.defaultOptions.jsonEvents, function(jsonEvent) {
    jsonEvent.id = self.nextEventId();
    return new MiniCalendar.Event(jsonEvent);
  });

  self.drawMarkers();
  self.drawEventsContainer();

  self.refreshCalendar();
  console.log(self.name + ' initialized!');
};
// Recalculates and draws the calendar
MiniCalendar.Calendar.prototype.refreshCalendar = function() {
  'use strict';
  var self = this;
  self.calcGrid();
  self.drawGrid();
};
// Maps an array of events to an array of column groups, representing overlapping events
MiniCalendar.Calendar.prototype.mapToColumnGroups = function() {
  'use strict';
  var self = this;

  var columnGroups = [];
  var currentColumn;
  var lastEnd = -100000000000000000000;
  var sortedEvents = self.events.sort(MiniCalendar.Calendar.startSortComparator);

  for(var i = 0; i < sortedEvents.length;) {
    var currentBucket = [];

    var currentEvent = self.events[i];
    currentBucket.push(currentEvent);

    var j = 1;
    while((i + j) < sortedEvents.length && self.events[i + j].start < currentEvent.end) {
      currentBucket.push(self.events[i + j]);
      j++;
    }

    // Add the row, column, width in percentage of the col, and offset denoting which col it resides in
    for(var k = 0; k < currentBucket.length; k++) {
      currentBucket[k].row = columnGroups.length;
      currentBucket[k].col = k;
      currentBucket[k].widthPct = (100 / currentBucket.length);
      currentBucket[k].widthOffset = (100 / currentBucket.length) * k;
    }

    columnGroups.push(currentBucket);
    i += j;
  }

  self.mappedEvents = columnGroups;
};
// Comparator for sorting an array of events - First by start time, then by end time
MiniCalendar.Calendar.startSortComparator = function(firstEvent, secondEvent) {
  'use strict';
  var startDifference = firstEvent.start - secondEvent.start;
  if(startDifference) {
    return startDifference;
  } else {
    var endDifference = firstEvent.end - secondEvent.end;
    return endDifference;
  }
};
// Adds an event to the calendar given an event name, start time, and end time in a JSON object
MiniCalendar.Calendar.prototype.addEvent = function(newEventJSON) {
  'use strict';
  var self = this;
  console.log('Adding event to MiniCalendar!');

  newEventJSON.id = self.nextEventId();
  var newEvent = new MiniCalendar.Event(newEventJSON);

  var doesEventExist = _.findWhere(self.events, { name: newEvent.name, start: newEvent.start, end: newEvent.end });
  if(doesEventExist !== undefined) {
    console.log('Event already present in events list!');
    return;
  }

  self.events.push(newEvent);
  self.refreshCalendar();
  console.log('Event added!');
};
// Removes an event from the calendar, given the event's id
MiniCalendar.Calendar.prototype.removeEventById = function(rmId) {
  'use strict';
  var self = this;

  var rmId = Number(rmId);
  console.log('Removing event by ID with ID of ' + rmId);
  console.log('Event to be removed: ');
  console.log(rmId);

  var idList = _.pluck(self.events, 'id');

  if(_.contains(idList, rmId)) {
    self.events = self.events.filter(function (ev) {
                        return ev.id !== rmId;
                      });
  } else {
    console.log('ERROR: Event was not found in events list!');
  }

  self.refreshCalendar();
  console.log('Event ' + rmId + ' removed by ID!');
};
// Removes an event from the calendar, given a mouseEvent El (i.e. user clicked 'remove event' button)
MiniCalendar.Calendar.prototype.removeEventByEl = function(mouseEvent) {
  'use strict';
  var self = this;

  var eventIDToRemove = mouseEvent.target.parentNode.dataset.eventId;
  console.log('Removing event by "x" el by removing event ' + eventIDToRemove + 'from list.');
  self.removeEventById(eventIDToRemove);
};
// Calculates the layout height, width, and offset parameters of the events
MiniCalendar.Calendar.prototype.calcGrid = function() {
  'use strict';
  var self = this;
  console.log('Recalculating Grid Params!');

  _.each(self.events, function(event) {
    event.height = self.calcEventHeight(event);
    event.offset = event.start;
  });

  self.mapToColumnGroups();
  console.log('Recalculated Grid Params!');
};
// Calculates the height / duration of the given event
MiniCalendar.Calendar.prototype.calcEventHeight = function(event) {
  'use strict';
  var self = this;
  return parseInt(event.end - event.start);
};
// Calculate and return a string representing the display time of the current event
MiniCalendar.Calendar.prototype.calcDisplayTime = function(minutesPastStart) {
  'use strict';
  var self = this;
  var hours = ((parseInt(minutesPastStart) + self.calendarStartTime)/60) > 9 ? parseInt((minutesPastStart + self.calendarStartTime)/60) : '0' + parseInt((minutesPastStart + self.calendarStartTime)/60);
  var minutes = minutesPastStart%60 > 9 ? minutesPastStart%60 : '0' + minutesPastStart%60;
  return hours + ':' + minutes;
};
// Clear the events grid of all events
MiniCalendar.Calendar.prototype.clearGrid = function() {
  'use strict';
  var self = this;
  console.log('Clearing Grid on el: ' + self.els.calendar);

  var myNode = document.getElementById(self.els.calendar);
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }

  console.log('Cleared Grid on el: ' + self.els.calendar);
};
// Initialize the markers on the app element
MiniCalendar.Calendar.prototype.drawMarkers = function() {
  'use strict';
  var self = this;
  console.log('Drawing Markers!');
  var appEl = $(self.els.app);

  // Create Calendar Markers Container Layers
  var calendarMarkersWrapperEl = document.createElement('div');
  calendarMarkersWrapperEl.id = 'calendar-markers-wrapper';
  var calendarMarkersEl = document.createElement('div');
  calendarMarkersEl.id = 'calendar-markers';

  var markersContainer = calendarMarkersEl;
  var startHour = (self.calendarStartTime)/60;
  var endHour = (self.calendarEndTime)/60;

  // Add Major and Minor markers to the calendar-markers container
  for(var i = self.calendarStartTime; i < self.calendarEndTime; i = i + 60) {
    var currentHour = i / 60;

    var minutesAfterStartTime = parseInt(i - self.calendarStartTime);

    var majorMarker = MiniCalendar.Calendar.majorMarkerFactory(currentHour);
    if(minutesAfterStartTime === 0) {
      majorMarker.style.top = 'auto';
    } else {
      majorMarker.style.top = minutesAfterStartTime + 'px';
    }

    var minorMarker = MiniCalendar.Calendar.minorMarkerFactory(currentHour);
    minorMarker.style.top = (minutesAfterStartTime + 30) + 'px';

    markersContainer.appendChild(majorMarker);
    markersContainer.appendChild(minorMarker);
  }

  // Append the markers container and wrapper el to the app el
  calendarMarkersWrapperEl.appendChild(calendarMarkersEl);
  appEl.append(calendarMarkersWrapperEl);
};
// Initialize the Events container on the app element
MiniCalendar.Calendar.prototype.drawEventsContainer = function() {
  'use strict';
  var self = this;
  var appEl = $(self.els.app);

  // Create Calendar Events Contaienr Layers
  var calendarEventsWrapperEl = document.createElement('div');
  calendarEventsWrapperEl.id = 'calendar-events-wrapper';
  var calendarEventsBackgroundEl = document.createElement('div');
  calendarEventsBackgroundEl.id = 'calendar-events-background';
  var calendarEventsEl = document.createElement('div');
  calendarEventsEl.id = 'calendar-events';

  // Append them to the appEl
  calendarEventsBackgroundEl.appendChild(calendarEventsEl);
  calendarEventsWrapperEl.appendChild(calendarEventsBackgroundEl);
  appEl.append(calendarEventsWrapperEl);
};
// Draws the array of mapped events on the calendar grid
MiniCalendar.Calendar.prototype.drawGrid = function() {
  'use strict';
  var self = this;
  console.log('Drawing Grid on el: ' + self.els.calendar);
  
  var calendarContainer = $(self.els.calendar);
  calendarContainer.html('');

  _.each(self.mappedEvents, function(eventRow){
    _.each(eventRow, function(event) {
      console.log('Drawing EventByStart: ' + event.name + '\t\tStart: ' + event.start + '\tEnd: ' + event.end + '\tId: ' + event.id);
      var newEventWidget = self.widgetFactory(event);
      if( event.widthOffset > 0 ) {
        newEventWidget.style.left = event.widthOffset + '%';
      }
      newEventWidget.style.width = event.widthPct + '%';
      calendarContainer.append(newEventWidget);

    });
  });
  console.log('Drew Grid on el: ' + self.els.calendar);
};
// Contstructs an event widget given a JSON formatted input object with the name, id, start, and end time
MiniCalendar.Calendar.prototype.widgetFactory = function(event) {
  'use strict';
  var self = this;

  // Create Event Name Div
  var divEventName = document.createElement('div');
  divEventName.classList.add('event-name');
  var textEventName = document.createTextNode(event.name);
  divEventName.appendChild(textEventName);

  // Create Event Start Div
  var divEventStart = document.createElement('div');
  divEventStart.classList.add('event-start');
  var textEventStart = document.createTextNode(self.calcDisplayTime(event.start));
  divEventStart.appendChild(textEventStart);

  // Create Event End Div
  var divEventEnd = document.createElement('div');
  divEventEnd.classList.add('event-end');
  var textEventEnd = document.createTextNode(self.calcDisplayTime(event.end));
  divEventEnd.appendChild(textEventEnd);

  // Create Container Element To Display Formatted Time
  var divEventTimeContainer = document.createElement('div');
  divEventTimeContainer.classList.add('event-time-container');
  var textTimeSeparator = document.createTextNode(' - ');
  divEventTimeContainer.appendChild(divEventStart);
  divEventTimeContainer.appendChild(textTimeSeparator);
  divEventTimeContainer.appendChild(divEventEnd);

  // Create Button For Removing Event From Planner
  var divRemoveEventButton = document.createElement('div');
  divRemoveEventButton.classList.add('remove-event');
  var removeEventButtonText = document.createTextNode('remove event');
  divRemoveEventButton.appendChild(removeEventButtonText);
  divRemoveEventButton.addEventListener('click', self.removeEventByEl.bind(self));

  // Create Event Container Element To Hold All Component Elements
  var divEventContainer = document.createElement('div');
  divEventContainer.classList.add('event-container');
  divEventContainer.setAttribute('data-event-id', event.id);
  divEventContainer.style.height = event.height + 'px';
  if(event.offset < 1) {
    divEventContainer.style.top = 'auto';
  } else {
    divEventContainer.style.top = event.offset + 'px';
  }

  // Append All Individual Elements To Event Container
  divEventContainer.appendChild(divEventName);
  divEventContainer.appendChild(divEventTimeContainer);
  divEventContainer.appendChild(divRemoveEventButton);

  return divEventContainer;
};
MiniCalendar.Calendar.minorMarkerFactory = function(militaryHour) {
  'use strict';

  var divTimeLabel = MiniCalendar.Calendar.timeLabelFactory(parseInt(militaryHour), 30);
  var divMarker = document.createElement('div');
  divMarker.classList.add('marker-minor');
  divMarker.classList.add('right');
  divMarker.appendChild(divTimeLabel.divTime);

  return divMarker;
};
MiniCalendar.Calendar.majorMarkerFactory = function(militaryHour) {
  'use strict';
  
  var divTimeLabel = MiniCalendar.Calendar.timeLabelFactory(parseInt(militaryHour), 0);
  var divMarker = document.createElement('div');
  divMarker.classList.add('marker-major');
  divMarker.classList.add('right');
  divMarker.appendChild(divTimeLabel.divTime);
  divMarker.appendChild(divTimeLabel.divSuffix);

  return divMarker;
};
MiniCalendar.Calendar.timeLabelFactory = function(militaryHour, minutes) {
  'use strict';
  var suffixText;
  var markerText;
  var twelveHour;

  if(militaryHour < 13) {
    twelveHour = militaryHour;
    suffixText = document.createTextNode('am');
  } else {
    twelveHour = militaryHour - 12;
    suffixText = document.createTextNode('pm');
  }

  if(minutes < 10) {
    markerText = document.createTextNode(twelveHour + ':0' + minutes);
  } else {
    markerText = document.createTextNode(twelveHour + ':' + minutes);
  }

  var divTime = document.createElement('span');
  divTime.classList.add('time');
  divTime.appendChild(markerText);

  var divSuffix = document.createElement('span');
  divSuffix.classList.add('suffix');
  divSuffix.appendChild(suffixText);

  return {
    divTime: divTime,
    divSuffix: divSuffix
  };
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
