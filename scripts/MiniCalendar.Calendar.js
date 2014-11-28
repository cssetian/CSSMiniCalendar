var MiniCalendar = MiniCalendar || {};

MiniCalendar.Calendar = function(userOptions) {
  'use strict';
  var self = this;
  console.log('Initializing Calendar!');

  self.defaultOptions = {
    els: {
      container: '#calendar-container-wrapper',
      calendar: '#container-calendar',
      markers: '#container-markers',
      app: '#calendar-app'
    },
    name: 'Unititled Mini Calendar',
    widgetWidth: 250,
    widgetHeight: 40,
    containerHeight: 720,
    containerWidth: 620,
    containerWidthPadding: 10,
    containerHeightPadding: 10,
    startTime: 9 * 60,
    endTime: 21 * 60,
    events: []
  };
  self.mergedOptions = $.extend({}, self.defaultOptions, userOptions);

  self.containerEl = self.mergedOptions.els.container;
  self.calendarEl = self.mergedOptions.els.calendar;
  self.markersEl = self.mergedOptions.els.markers;

  self.name = self.mergedOptions.name;
  self.columns = 1;
  self.startTime = self.mergedOptions.startTime;
  self.endTime = self.mergedOptions.endTime;

  self.CONTAINER_HEIGHT_PADDING_PX = self.mergedOptions.containerHeight;
  self.CONTAINER_WIDTH_PADDING_PX = self.mergedOptions.containerWidth;
  self.CONTAINER_HEIGHT_PX = self.mergedOptions.containerHeight;
  self.MINUTE_HEIGHT = parseFloat(self.CONTAINER_HEIGHT_PX) / parseFloat(self.endTime - self.startTime);

  self.currentEventId = self.mergedOptions.events.length + 1;
  self.nextEventId = function() { return self.currentEventId++; };

  self.HOUR_HEIGHT = self.MINUTE_HEIGHT * 60;
  self.DAY_HEIGHT = self.MINUTE_HEIGHT * 60 * 24;
  self.CONTAINER_PADDING_PX = 3;

  self.MARKER_HEIGHT_PX = self.MINUTE_HEIGHT * 16;
  self.MARKER_WIDTH_PX = self.MINUTE_HEIGHT * 30;
  self.MARKER_OFFSET_PX = 0; //self.MINUTE_HEIGHT * self.MARKER_HEIGHT_PX;

  self.WIDGET_WIDTH_PX = self.mergedOptions.widgetWidth;
  self.WIDGET_MARGIN_PX = 4;
  self.WIDGET_HORZ_SPACING_PX = 2;
  self.WIDGET_BORDER_PX = 1;
  self.WIDGET_OFFSET_PX = self.WIDGET_WIDTH_PX + (self.WIDGET_BORDER_PX * 2);

  self.CALC_COLUMN_WIDTH = function() {
    return self.columns;
  };


  self.events = [];
  _.each(self.mergedOptions.events, function(event) {
    self.events.push(new MiniCalendar.Event(event));
  });
  self.drawMarkers();
  self.calcGrid();
  self.drawGrid();
  console.log(self.name + ' initialized!');
};

MiniCalendar.Calendar.prototype.mapToColumnGroups = function() {
  'use strict';
  var self = this;
  console.log('mapToColumns - current Columns', self.events);
  var calendarColumns = [];
  var sortedEvents = self.events.sort(self.startSortComparator);

  var columnGroups = [];
  var currentColumn;
  var lastEnd = -100000000000000000000;
  $.each(sortedEvents, function (index, event) {
    var start = event.start;
    var end = event.end;
    if (!currentColumn || lastEnd > start) {
      if(columnGroups.length > 0) {

      }
      currentColumn = new Array();
      columnGroups.push(currentColumn);
    }
    event.column = columnGroups.length - 1;
    currentColumn.push(event);
    lastEnd = Math.max(lastEnd, end);
  });

  self.columns = columnGroups.length;
  self.columnGroups = columnGroups;

  console.log('mapToColumns - after sort/each - self.events', self.events, 'columnGroups', currentColumn);
  console.log('column groups: ', columnGroups);
  return columnGroups;
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

  if(_.contains(idList, rmId)) {
    self.events = self.events.filter(function (ev) {
                        return ev.id !== rmId;
                      });
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
  var gridColumns = self.mapToColumnGroups();
  //console.log('gridColumns! - ', gridColumns);

  _.each(self.eventsByStart(), function(eventGroup) {
    _.each(eventGroup, function(event) {
      console.log('Calcing (Printing) EventByStart: ' + event.name + '\t\tStart: ' + event.start + '\tEnd: ' + event.end + '\tId: ' + event.id);
    });
  });

  console.log('Recalculated Grid Params!');
};
///
///
//      NEED TO IMPLEMENT A CALCULATE_X_OFFSET AND CALCULATE_X_WIDTH FUNCTION, SO THAT WIDGETS CAN BE A % OF THE CONTAINER SIZE
//
//
//


MiniCalendar.Calendar.prototype.calcHeight = function(event) {
  'use strict';
  var self = this;
  return (event.end - event.start) * self.MINUTE_HEIGHT;
};
MiniCalendar.Calendar.prototype.calcOffset = function(minutesPastNine) {
  'use strict';
  var self = this;
  return parseFloat(minutesPastNine) * self.MINUTE_HEIGHT;
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
MiniCalendar.Calendar.prototype.drawGrid = function() {
  'use strict';
  var self = this;
  console.log('Drawing Grid on el: ' + self.calendarEl);
  
  var calendarContainer = $(self.calendarEl);
  calendarContainer.html('');
  (document.getElementById('calendar-events-wrapper')).style.width = (self.columns * self.WIDGET_OFFSET_PX) + 'px';
  (document.getElementById('calendar-events-wrapper')).style.height = self.containerHeight + 'px';
  (document.getElementById('calendar-markers')).style.height = self.containerHeight + 'px';
  (document.getElementById('calendar-markers-wrapper')).style.width = (self.markerHeight) + 'px';

  //var tempcontainer = document.createElement('div');
  _.each(self.events, function(event){
    console.log('Drawing EventByStart: ' + event.name + '\t\tStart: ' + event.start + '\tEnd: ' + event.end + '\tId: ' + event.id);

    var newEventWidget = self.widgetFactory(event);
    if( event.column > 0 ) {
      newEventWidget.style.left = (self.WIDGET_OFFSET_PX * event.column) + 'px';
    }
    calendarContainer.append(newEventWidget);
  });

  //calendarContainer.append(tempcontainer);
  
  $('.event-container').css('position', 'absolute');
  $('.marker-major').css('position', 'absolute');
  $('.marker-minor').css('position', 'absolute');
  

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

MiniCalendar.Calendar.prototype.drawMarkers = function() {
  'use strict';
  var self = this;

  var markersContainer = $(self.markersEl);
  var startHour = (self.startTime)/60;
  var endHour = (self.endTime)/60;

  for(var i = self.startTime; i < self.endTime; i = i + 60) {
    var currentHour = i / 60;

    var minutesAfterStartTime = i - self.startTime;
    var currentMarkerOffsetPx = minutesAfterStartTime * self.MINUTE_HEIGHT;

    var majorMarker = self.majorMarkerFactory(currentHour);
    if(currentMarkerOffsetPx === 0) {
      majorMarker.style.top = 'auto';
    } else {
      majorMarker.style.top = currentMarkerOffsetPx + 'px';
    }

    var minorMarker = self.minorMarkerFactory(currentHour);
    minorMarker.style.top = (currentMarkerOffsetPx + 30) + 'px';

    markersContainer.append(majorMarker);
    markersContainer.append(minorMarker);
  }
};
MiniCalendar.Calendar.prototype.minorMarkerFactory = function(militaryHour) {
  'use strict';
  var self = this;

  var divTimeLabel = self.createTimeLabel(militaryHour, 30);
  var divMarker = document.createElement('div');
  divMarker.classList.add('marker-minor');
  divMarker.classList.add('right');
  divMarker.appendChild(divTimeLabel.divTime);

  return divMarker;
};
MiniCalendar.Calendar.prototype.majorMarkerFactory = function(militaryHour) {
  'use strict';
  var self = this;
  
  var divTimeLabel = self.createTimeLabel(militaryHour, 0);
  var divMarker = document.createElement('div');
  divMarker.classList.add('marker-major');
  divMarker.classList.add('right');
  divMarker.appendChild(divTimeLabel.divTime);
  divMarker.appendChild(divTimeLabel.divSuffix);

  return divMarker;
};
MiniCalendar.Calendar.prototype.createTimeLabel = function(militaryHour, minutes) {
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
