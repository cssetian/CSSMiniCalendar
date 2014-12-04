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
    name: 'Sample Mini Calendar',
    containerHeight: 720,
    containerWidth: 620,
    startTime: 9 * 60,
    endTime: (9 + 12) * 60,
    jsonEvents: [
      { start: 0, end: 60 },
      { start: 10, end: 140 },
      { start: 180, end: 240 },
      { start: 100, end: 180 },
      { start: 60, end: 120 },
      { start: 200, end: 300 },
      { start: 360, end: 450 }
    ]
  };
  self.mergedOptions = $.extend(true, self.defaultOptions, userOptions);
  self.mergedOptions.jsonEvents = userOptions.jsonEvents ? userOptions.jsonEvents : self.defaultOptions.jsonEvents;

  self.name = self.mergedOptions.name;
  self.currentEventId = 1;
  self.nextEventId = function() { return self.currentEventId++; };
  self.calendarStartTime = parseInt(self.mergedOptions.startTime);
  self.calendarEndTime = parseInt(self.mergedOptions.endTime);
  self.els = self.mergedOptions.els;

  // Initialize user-defined events that are passed in JSON as MiniCalendar.Event objects
  self.events = _.map(self.mergedOptions.jsonEvents, function(jsonEvent) {
    jsonEvent.id = self.nextEventId();
    return new MiniCalendar.Event(jsonEvent);
  });

  self.clearGrid();
  self.drawMarkers();
  self.drawEventsContainer();
  self.refreshCalendar();
  console.log(self.name + ' initialized!');
};
// Recalculates and draws the calendar
MiniCalendar.Calendar.prototype.refreshCalendar = function() {
  'use strict';
  var self = this;
  self.clearGrid();
  self.calcGrid();
  self.drawGrid();
};
// Clear the events grid of all events
MiniCalendar.Calendar.prototype.clearGrid = function() {
  'use strict';
  var self = this;
  console.log('Clearing App El');
  $(self.els.calendar).html('');
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

  self.mapToColumns();
  console.log('Recalculated Grid Params!');
};
// Draws the array of mapped events on the calendar grid
MiniCalendar.Calendar.prototype.drawGrid = function() {
  'use strict';
  var self = this;
  console.log('Drawing Grid on el: ' + self.els.calendar);
  
  var calendarContainer = $(self.els.calendar);
  calendarContainer.html('');

  _.each(self.events, function(event) {
    console.log('Drawing EventByStart: ' + event.name + '\t\tStart: ' + event.start + '\tEnd: ' + event.end + '\tId: ' + event.id + '\tWidth: ' + event.numTotalColsIdx + '\tCol: ' + event.col);
    
    var eventWidth = MiniCalendar.Calendar.calcEventWidth(event, self.mergedOptions.containerWidth);
    var newEventWidget = self.widgetFactory(event);

    newEventWidget.style.left = eventWidth * event.col + 'px';
    newEventWidget.style.width = eventWidth + 'px';
    calendarContainer.append(newEventWidget);
  });
  console.log('Drew Grid on el: ' + self.els.calendar);
};
// Map all events to columns and give them widths so they don't overlap
MiniCalendar.Calendar.prototype.mapToColumns = function() {
  'use strict';
  var self = this;
  var sortedEvents = self.events.sort(MiniCalendar.Calendar.startSortComparator);

  // Make sure any 2 adjacent events that overlap with each other are in the same bucket of events
  // This will cause more columns than absolutely necessary, but satisfy the requirement that
  //      all overlapping events in a given group should have the same Width
  _.each(sortedEvents, function(event, idx){
    var overlapsWithEvents = false;
    var eventsThatOverlap = [];
    var occupiedColumns = [];

    event.col = 0;
    event.numTotalColsIdx = 0;

    for(var i = 0; i < idx; i++ ){
      var testOverlapEvent = sortedEvents[i];

      if(event.overlap(testOverlapEvent)){
        //update overlap flag so that event columns can be updated
        overlapsWithEvents = true;

        //Overlapping events are stored together for updating
        //    their columns after all have been computed
        eventsThatOverlap.push(testOverlapEvent);

        //Update the column flags keeping track of which 
        //    columns contain events
        occupiedColumns[testOverlapEvent.col] = true;
        while(occupiedColumns[event.col]){
          event.col++;
        }
      }
    }

    // If event overlaps with other events, identify the adjacent
    //      columns so events can be rendered with proper ordering and width
    if(overlapsWithEvents) {
      MiniCalendar.Calendar.updateAdjacentEvents(event, eventsThatOverlap);
    }
  });

  //  Once processed, Add the total number of columns to each
  //      event for proper event proportional width sizing.
  _.each(sortedEvents, function(a){
    MiniCalendar.Calendar.calcColGroupWidth(a);
  });

  console.log('sorted events!', sortedEvents);
  return sortedEvents;
};
// Test each event that overlaps with the current event in question.
// If current overlapping event is in column to the right of
//      the test event, add to collection of 'right' events.
// Otherwise, add event in question to the current overlapping
//      event's 'right' events.
MiniCalendar.Calendar.updateAdjacentEvents = function(event, eventsThatOverlap){
  'use strict';
  _.each(eventsThatOverlap, function(overlappingEvent){
    if (event.col < overlappingEvent.col) {
      event.right = event.right ? event.right.concat([overlappingEvent]) : [overlappingEvent];
    } else {
      overlappingEvent.right = overlappingEvent.right ? overlappingEvent.right.concat([event]) : [event];
    }
  });
};
//Compute the max number of columns in a row for a given event
MiniCalendar.Calendar.calcColGroupWidth = function(event, max){
  'use strict';
  // If you've traversed your way to the event that is in the max column,
  //      just return that column's count for total number of columns
  //      and exit the recrusive loop.
  if(event.isMaxCol){
    return event.numTotalColsIdx;
  }

  // Initialize the max total number of columns before we begin recursing
  max = max || -1;
  event.numTotalColsIdx = _.max([event.col,
                              event.numTotalColsIdx,
                              max]);

  if(event.right){
    // For each event to the right of the current event, 
    // check to see if a higher total column width can be computed
    _.each(event.right, function(a){
      event.numTotalColsIdx = _.max([event.col,
                                  event.numTotalColsIdx,
                                  MiniCalendar.Calendar.calcColGroupWidth(a, event.numTotalColsIdx)]);
    });
  }

  // Stop calculations when flag is set
  event.isMaxCol = true;
  return event.numTotalColsIdx;
};
// Calculates the height / duration of the given event
MiniCalendar.Calendar.prototype.calcEventHeight = function(event) {
  'use strict';
  var self = this;
  return parseInt(event.end - event.start);
};
// Calculate the pixel-based column width of an event, given the container width
MiniCalendar.Calendar.calcEventWidth = function(event, containerWidth){
  'use strict';
  var numEventsToRight = 0;
  if(event.right) { numEventsToRight = event.right.length; }

  var colWidth = containerWidth / (event.numTotalColsIdx + 1);
  var occupyingCols = 1;

  // Expand and fill the missing cols
  if((event.col + numEventsToRight) < event.numTotalColsIdx) {
    var findEventToRightComparator = function(eventToRight) {
      return (eventToRight.col === i);
    };

    // Loop through the columns to the right of the event looking for an empty column
    for(var i = event.col + 1; i <= event.numTotalColsIdx; i++ ) {
      // Attempt to find a column to the right of the current column that has the same col
      var foundEventToRight = _.find(event.right, findEventToRightComparator);

      // Break out of loop when collision occurs
      if(foundEventToRight) {
        break;
      }
      // Keep expanding the event's width to the right until a collision occurs
      occupyingCols++;
    }
    return occupyingCols*colWidth;
  }
  return colWidth;
};
// Calculate and return a string representing the display time of the current event
MiniCalendar.Calendar.prototype.calcDisplayTime = function(minutesPastStart) {
  'use strict';
  var self = this;
  var numericHour = parseInt((parseInt(minutesPastStart) + parseInt(self.calendarStartTime))/60);
  var minutes = minutesPastStart%60 > 9 ? minutesPastStart%60 : '0' + minutesPastStart%60;
  return numericHour + ':' + minutes;
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
MiniCalendar.Calendar.prototype.isBetweenStartAndEndTime = function(time) {
  'use strict';
  var self = this;
  return time >= 0 && time <= self.calendarEndTime - self.calendarStartTime;
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
// Contstructs an event widget given a JSON formatted input object with the name, id, start, and end time
MiniCalendar.Calendar.prototype.widgetFactory = function(event) {
  'use strict';
  var self = this;

  // Create Event Name Div
  var divEventName = document.createElement('div');
  divEventName.classList.add('event-name');
  var textEventName = document.createTextNode(event.name);
  divEventName.appendChild(textEventName);

  var divEventLocation = document.createElement('div');
  divEventLocation.classList.add('event-location');
  var textEventLocation = document.createTextNode(event.location);
  divEventLocation.appendChild(textEventLocation);

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
  //divRemoveEventButton.addEventListener('click', self.removeEventByEl.bind(self));

  // Create Event Container Element To Hold All Component Elements
  var divEventContainer = document.createElement('div');
  divEventContainer.classList.add('event-container');
  if(event.end - event.start < 45) { 
    divEventContainer.classList.add('inline-event');
  }
  divEventContainer.setAttribute('data-event-id', event.id);
  divEventContainer.style.height = event.height + 'px';
  if(event.offset < 1) {
    divEventContainer.style.top = 'auto';
  } else {
    divEventContainer.style.top = event.offset + 'px';
  }

  // Append All Individual Elements To Event Container
  divEventContainer.appendChild(divEventName);
  divEventContainer.appendChild(divEventLocation);
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
