var MiniCalendar = MiniCalendar || {};

MiniCalendar.Calendar = function(userOptions) {
  'use strict';
  var self = this;
  console.log('Initializing Calendar!');
  self.drawMarkers();

  self.defaultOptions = {
    els: {
      container: '#calendar-container-wrapper',
      calendar: '#container-calendar',
      markers: '#container-markers',
      app: '#calendar-app'
    },
    name: 'Unititled Mini Calendar',
    containerHeight: 720,
    containerWidth: 620,
    startTime: 9 * 60,
    endTime: (9 + 12) * 60,
    events: [],
    mappedEvents: []
  };
  self.mergedOptions = $.extend({}, self.defaultOptions, userOptions);

  // Initialize user-defined events that are passed in JSON as MiniCalendar.Event objects
  self.mappedEvents = [];
  self.events = self.defaultOptions.events.concat(
    _.map(userOptions.events, function(jsonEvent) {
      return new MiniCalendar.Event(jsonEvent);
    })
  );

  self.containerEl = self.mergedOptions.els.container;
  self.calendarEl = self.mergedOptions.els.calendar;
  self.markersEl = self.mergedOptions.els.markers;

  self.name = self.mergedOptions.name;
  self.startTime = self.mergedOptions.startTime;
  self.endTime = self.mergedOptions.endTime;

  self.currentEventId = self.mergedOptions.events.length + 1;
  self.nextEventId = function() { return self.currentEventId++; };


  self.refreshCalendar();
  console.log(self.name + ' initialized!');
};

MiniCalendar.Calendar.prototype.refreshCalendar = function() {
  'use strict';
  var self = this;

  self.drawMarkers();
  self.calcGrid();
  self.drawGrid();
};

MiniCalendar.Calendar.prototype.mapToColumnGroups = function() {
  'use strict';
  var self = this;
  //console.log('mapToColumns - current Columns', self.events);

  var columnGroups = [];
  var currentColumn;
  var lastEnd = -100000000000000000000;

  var sortedEvents = self.events.sort(self.startSortComparator);

  for(var i = 0; i < sortedEvents.length;) {
    var currentBucket = [];

    var currentEvent = self.events[i];
    currentBucket.push(currentEvent);

    var j = 1;
    while((i + j) < sortedEvents.length && self.events[i + j].start < currentEvent.end) {
      currentBucket.push(self.events[i + j]);
      j++;
    }

    // Add the row, column, 
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

MiniCalendar.Calendar.prototype.startSortComparator = function(firstEvent, secondEvent) {
  var startDifference = firstEvent.start - secondEvent.start;
  if(startDifference) {
    return startDifference;
  } else {
    var endDifference = firstEvent.end - secondEvent.end;
    return endDifference;
  }
};

MiniCalendar.Calendar.prototype.addEvent = function(newEvent) {
  'use strict';
  var self = this;
  console.log('Adding event to MiniCalendar!');
  newEvent.id = self.nextEventId();

  var doesEventExist = _.findWhere(self.events, { name: newEvent.name, start: newEvent.start, end: newEvent.end, id: newEvent.id });
  if(doesEventExist !== undefined) {
    console.log('Event already present in events list!');
    return;
  }

  self.events.push(newEvent);
  self.refreshCalendar();
  console.log('Event added!');
};
MiniCalendar.Calendar.prototype.removeEvent = function(rmEvent) {
  'use strict';
  var self = this;
  console.log('Removing event from MiniCalendar!');
  console.log('Event to be removed: ');
  console.log(rmEvent);
  console.log('Current Events List: ');
  console.log(self.events);

  var objObjComparator = function(event) { return (event.id === rmEvent.id); };

  if(!_.contains(self.events, rmEvent)) {
    self.events = _.reject(self.events, objObjComparator);
  } else {
    console.log('ERROR: Event not found to remove!');
    return;
  }

  self.refreshCalendar();
  console.log('Event removed!');
};
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
MiniCalendar.Calendar.prototype.removeEventByEl = function(mouseEvent) {
  'use strict';
  var self = this;

  var eventIDToRemove = mouseEvent.target.parentNode.dataset.eventId;
  console.log('Removing event by "x" el by removing event ' + eventIDToRemove + 'from list.');
  self.removeEventById(eventIDToRemove);
};
MiniCalendar.Calendar.prototype.calcGrid = function() {
  'use strict';
  var self = this;
  console.log('Recalculating Grid Params!');

  _.each(self.events, function(event) {
    event.height = self.calcHeight(event);
    event.offset = self.calcOffset(event.start);
  });

  self.mapToColumnGroups();
  console.log('Recalculated Grid Params!');
};

MiniCalendar.Calendar.prototype.calcHeight = function(event) {
  'use strict';
  var self = this;
  return parseInt(event.end - event.start);
};
MiniCalendar.Calendar.prototype.calcOffset = function(minutesPastNine) {
  'use strict';
  var self = this;
  return parseInt(minutesPastNine);
};
MiniCalendar.Calendar.prototype.calcDisplayTime = function(minutesPastNine) {
  'use strict';
  var hours = (parseInt(minutesPastNine/60) + 9) > 9 ? (parseInt(minutesPastNine/60) + 9) : '0' + (parseInt(minutesPastNine/60) + 9);
  var minutes = minutesPastNine%60 > 9 ? minutesPastNine%60 : '0' + minutesPastNine%60;
  return hours + ':' + minutes;
};
MiniCalendar.Calendar.prototype.clearGrid = function() {
  'use strict';
  var self = this;
  console.log('Clearing Grid on el: ' + self.calendarEl);

  var myNode = document.getElementById(self.calendarEl);
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }

  console.log('Cleared Grid on el: ' + self.calendarEl);
};
MiniCalendar.Calendar.prototype.drawMarkers = function() {
  'use strict';
  var self = this;
  console.log('Drawing Markers!');

  var markersContainer = $(self.markersEl);
  var startHour = (self.startTime)/60;
  var endHour = (self.endTime)/60;

  for(var i = self.startTime; i < self.endTime; i = i + 60) {
    var currentHour = i / 60;

    var minutesAfterStartTime = parseInt(i - self.startTime);

    var majorMarker = self.majorMarkerFactory(currentHour);
    if(minutesAfterStartTime === 0) {
      majorMarker.style.top = 'auto';
    } else {
      majorMarker.style.top = minutesAfterStartTime + 'px';
    }

    var minorMarker = self.minorMarkerFactory(currentHour);
    minorMarker.style.top = (minutesAfterStartTime + 30) + 'px';

    markersContainer.append(majorMarker);
    markersContainer.append(minorMarker);
  }
};
MiniCalendar.Calendar.prototype.drawGrid = function() {
  'use strict';
  var self = this;
  console.log('Drawing Grid on el: ' + self.calendarEl);
  
  var calendarContainer = $(self.calendarEl);
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
  console.log('Drew Grid on el: ' + self.calendarEl);
};
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
MiniCalendar.Calendar.prototype.minorMarkerFactory = function(militaryHour) {
  'use strict';
  var self = this;

  var divTimeLabel = self.timeLabelFactory(militaryHour, 30);
  var divMarker = document.createElement('div');
  divMarker.classList.add('marker-minor');
  divMarker.classList.add('right');
  divMarker.appendChild(divTimeLabel.divTime);

  return divMarker;
};
MiniCalendar.Calendar.prototype.majorMarkerFactory = function(militaryHour) {
  'use strict';
  var self = this;
  
  var divTimeLabel = self.timeLabelFactory(militaryHour, 0);
  var divMarker = document.createElement('div');
  divMarker.classList.add('marker-major');
  divMarker.classList.add('right');
  divMarker.appendChild(divTimeLabel.divTime);
  divMarker.appendChild(divTimeLabel.divSuffix);

  return divMarker;
};
MiniCalendar.Calendar.prototype.timeLabelFactory = function(militaryHour, minutes) {
  'use strict';
  var self = this;
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
}
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
