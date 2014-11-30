var MiniCalendar = MiniCalendar || {};

MiniCalendar.Event = function(options) {
  'use strict';
  var self = this;

  self.id = options.id || -1;
  self.name = options.name || 'Untitled Event';
  self.start = options.start || 0;
  self.end = options.end || 0;
  self.height = '';
  self.offset = '';
  self.column = '';
  self.widthPct = '';
};