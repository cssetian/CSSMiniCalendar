var MiniCalendar = MiniCalendar || {};

MiniCalendar.Calendar = function(userOptions) {
  'use strict';
  var self = this;
  console.log('Initializing Calendar!');

  self.defaultOptions = {
    els: {
      container: 'calendar-container',
      calendar: 'container-calendar',
      markers: 'container-markers'
    },
    name: 'Unititled Mini Calendar',
    events: []
  };
  self.mergedOptions = $.extend({}, self.defaultOptions, userOptions);

  self.containerEl = self.mergedOptions.els.container;
  self.calendarEl = self.mergedOptions.els.calendar;
  self.markersEl = self.mergedOptions.els.markers;
  self.name = self.mergedOptions.name;
  self.currentEventId = self.mergedOptions.events.length + 1;
  self.nextEventId = function() { return self.currentEventId++; };

  self.MINUTE_HEIGHT = 1;
  self.HOUR_HEIGHT = self.MINUTE_HEIGHT * 60;
  self.DAY_HEIGHT = self.MINUTE_HEIGHT * 60 * 24;

  self.events = [];
  _.each(self.mergedOptions.events, function(event) {
    self.events.push(new MiniCalendar.Event(event));
  });
  self.drawMarkers();
  self.calcGrid();
  self.drawGrid();
  console.log(self.name + ' initialized!');
};

MiniCalendar.Calendar.prototype.mapToColumns = function() {
  'use strict';
  var self = this;
  console.log('mapToColumns - current Columns', self.events);
  var calendarColumns = [];
  var sortedEvents = _.sortBy(self.events, self.startSortComparator);

  var groups = [];
  var currentDay;
  var lastEnd = -1;
  $.each(sortedEvents, function (index, event) {
    var start = event.start;
    var end = event.end;
    if (!currentDay || lastEnd < start) {
      currentDay = [];
      groups.push(currentDay);
    }
    currentDay.push(event);
    lastEnd = Math.max(lastEnd, end);
  });

  console.log('mapToColumns - after sort/each', self.events);
  return currentDay;
};

MiniCalendar.Calendar.prototype.startSortComparator = function(firstEvent, secondEvent) {
  var startDifference = firstEvent.start - secondEvent.start;
  if(startDifference) {
    return startDifference;
  } else {
    var endDifference = firstEvent.end = secondEvent.end;
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
  self.calcGrid();
  self.drawGrid();
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
  console.log('Current Events List after remove: ');
  console.log(self.events);

  self.calcGrid();
  self.drawGrid();
  console.log('Event removed!');
};
MiniCalendar.Calendar.prototype.removeEventById = function(rmId) {
  'use strict';
  var self = this;

  var rmId = Number(rmId);
  console.log('Removing event by ID with ID of ' + rmId);
  console.log('Event to be removed: ');
  console.log(rmId);
  console.log('Current Events List: ');
  console.log(self.events);

  var idList = _.pluck(self.events, 'id');
  var idListComparator = function(id) { return id === rmId; };
  var idObjComparator = function(id) { return function(obj) { return obj.id === id; } };

  if(_.contains(idList, rmId)) {
    self.events = self.events.filter(function (ev) {
                        return ev.id !== rmId;
                       });;
  } else {
    console.log('ERROR: Event was not found in events list!');
  }

  console.log('Events List after remove by ID: ');
  console.log(self.events);

  self.calcGrid();
  self.drawGrid();
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

  // Fix mapToColumns - Currently produces an error with the end time of events. Also make sure the id is fixed
  // // Once mapped to columns, define css property for positioning based on calculating css offsets based on hours, minutes, seconds
  //var gridColumns = self.mapToColumns();
  //console.log('gridColumns! - ', gridColumns);

  _.each(self.eventsByStart(), function(eventGroup) {
    _.each(eventGroup, function(event) {
      console.log('Calcing (Printing) EventByStart: ' + event.name + '\t\tStart: ' + event.start + '\tEnd: ' + event.end + '\tId: ' + event.id);
    });
  });

  console.log('Recalculated Grid Params!');
};
MiniCalendar.Calendar.prototype.calcHeight = function(event) {
  'use strict';
  var self = this;
  return (event.end - event.start) * self.MINUTE_HEIGHT;
};
MiniCalendar.Calendar.prototype.calcOffset = function(minutesPastNine) {
  'use strict';
  var self = this;
  return (parseFloat(minutesPastNine) + (9 * 60)) * self.MINUTE_HEIGHT;
};
MiniCalendar.Calendar.prototype.getTime = function(minutesPastNine) {
  'use strict';
  var hours = (parseInt(minutesPastNine/60) + 9) > 10 ? (parseInt(minutesPastNine/60) + 9) : '0' + (parseInt(minutesPastNine/60) + 9);
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
MiniCalendar.Calendar.prototype.drawGrid = function() {
  'use strict';
  var self = this;
  console.log('Drawing Grid on el: ' + self.calendarEl);
  
  var calendarContainer = $(self.calendarEl);
  calendarContainer.html('');
  (document.getElementById('calendar-events')).style.height = self.DAY_HEIGHT + 'px';
  (document.getElementById('calendar-markers')).style.height = self.DAY_HEIGHT + 'px';

  var tempcontainer = document.createElement('div');
  _.each(self.events, function(event){
    console.log('Drawing EventByStart: ' + event.name + '\t\tStart: ' + event.start + '\tEnd: ' + event.end + '\tId: ' + event.id);
    var newEventWidget = self.createWidget(event);
    tempcontainer.appendChild(newEventWidget);
  });
  calendarContainer.append(tempcontainer);
  $('.event-container').css('position', 'absolute');
  $('.marker-container').css('position', 'absolute');


  console.log('Drew Grid on el: ' + self.calendarEl);
};
MiniCalendar.Calendar.prototype.createWidget = function(event) {
  'use strict';
  var self = this;

  var divEventContainer = document.createElement('div');
  divEventContainer.classList.add('event-container');
  divEventContainer.setAttribute('data-event-id', event.id);
  var CONTAINER_PADDING_PX = 6;
  divEventContainer.style.height = (event.height - CONTAINER_PADDING_PX) + 'px';
  if(event.offset < 1) {
    divEventContainer.style.top = 'auto';
  } else {
    divEventContainer.style.top = event.offset + 'px';
  }

  var divEventName = document.createElement('div');
  divEventName.classList.add('event-name');
  var textEventName = document.createTextNode(event.name);
  divEventName.appendChild(textEventName);
  divEventContainer.appendChild(divEventName);

  var divEventStart = document.createElement('div');
  divEventStart.classList.add('event-start');
  var textEventStart = document.createTextNode(self.getTime(event.start));
  divEventStart.appendChild(textEventStart);

  var divEventEnd = document.createElement('div');
  divEventEnd.classList.add('event-end');
  var textEventEnd = document.createTextNode(self.getTime(event.end));
  divEventEnd.appendChild(textEventEnd);

  var divEventTimeContainer = document.createElement('div');
  divEventTimeContainer.classList.add('event-time-container');
  var textTimeSeparator = document.createTextNode(' - ');
  divEventTimeContainer.appendChild(divEventStart);
  divEventTimeContainer.appendChild(textTimeSeparator);
  divEventTimeContainer.appendChild(divEventEnd);

  var divRemoveEventButton = document.createElement('div');
  divRemoveEventButton.classList.add('remove-event');
  var removeEventButtonText = document.createTextNode('remove event');
  divRemoveEventButton.appendChild(removeEventButtonText);
  divRemoveEventButton.addEventListener('click', self.removeEventByEl.bind(self));

  divEventContainer.appendChild(divEventName);
  divEventContainer.appendChild(divEventTimeContainer);
  divEventContainer.appendChild(divRemoveEventButton);

  return divEventContainer;
};

MiniCalendar.Calendar.prototype.drawMarkers = function() {
  'use strict';
  var self = this;
  var markerText;
  var markersContainer = $(self.markersEl);
  for(var i = 0; i < 24; i++) {
    var divMarker = document.createElement('div');
    divMarker.classList.add('marker-container');
    var markerText = document.createTextNode(i);
    var pixelsToNine = (60 * 9 * self.MINUTE_HEIGHT);
    var pixelsFromNine = (i * 60 * self.MINUTE_HEIGHT);
    var topOffset = self.calcOffset(pixelsFromNine - pixelsToNine);

    if(topOffset === 0) {
      divMarker.style.top = 'auto';
    } else {
      divMarker.style.top = topOffset + 'px';
    }

    if(i < 10) {
      markerText = document.createTextNode('0' + i + ':00');
    } else {
      markerText = document.createTextNode(i + ':00');
    }

    divMarker.appendChild(markerText);
    markersContainer.append(divMarker);
  }
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
