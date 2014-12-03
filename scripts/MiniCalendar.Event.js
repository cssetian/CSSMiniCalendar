var MiniCalendar = MiniCalendar || {};

MiniCalendar.Event = function(options) {
  'use strict';
  var self = this;

  self.id = options.id || -1;
  self.name = options.name || 'Sample Item';
  self.location = options.location || 'Sample Location';
  self.start = parseInt(options.start) || 0;
  self.end = parseInt(options.end) || 0;
  self.height = '';
  self.widthOffset = '';
  self.widthPct = '';

  self.overlap = function(event) {
    if(event === undefined) {
      return false;
    }
    return (self.start < event.end) && (self.end > event.start);
  };
};