var MiniCalendar = MiniCalendar || {};

MiniCalendar.Event = function(options) {
  var self = this;
  self.name = options.name || 'Untitled Event';
  self.start = options.start || 0;
  self.end = options.end || 0;
};