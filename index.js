var Q = require('q'),
    minimatch = require('minimatch'),
    _ = require('lodash');
/**
 * A collector for obtaining and presenting stats of various 
 * elements of a system
 */
function StatusCollector() {
  this.reset();
}

function Collector(name, fn) {
  this.name = name;
  this.fn = fn;
}

/**
 * resets the collectors to a null state so that there are no collectors
 * useful in testing
 * @private
 */
StatusCollector.prototype.reset = function() {
  this._collectors = {};
};

StatusCollector.prototype.info = function() {
  var keys = Object.keys(this._collectors).sort();
  process.stdout.write("Registered status collectors (" + keys.length + "):\n" + keys.join("\n") + "\n");
};

StatusCollector.prototype.inspect = function() {
  var keys = Object.keys(this._collectors).sort();
  return "<StatusCollector collectors=[" + keys.join(", ") + "]>"
}


Collector.prototype.execute = function() {
  var self = this;
  return Q().then(function() { return self.fn(); })
  .then(function(results) {
    var success = true;

    if(_.isObject(results)) success = results.success;

    return { name: self.name, success: success, results: results };
  })
  .catch(function(err) {
    return {name: self.name, success: false, error: err};
  });
};

/**
 * Registers a status collector
 * @param {string} name - the name of the collector. Should be a '.' seperated topographical name.
 * @param {function} fn - The function. Should return an object (or a promise that resolves to an object) that includes a key of  :success as a boolean
 * @public
 */
StatusCollector.prototype.register = function(name, fn) {
  return this._collectors[name] = new Collector(name, fn);
};

/**
 * Executes matching collectors and gathers the results
 * @param {string} glob - A glob to match collectors
 * @public
 */
StatusCollector.prototype.execute = function(glob) {
  var self = this,
      collectors = this.collectors(glob),
      proms = collectors.map(function(c) { return c.execute(); });

  return Q.all(proms);
};


/**
 * @param {string} glob - A glob to match collectors by
 * @return {array} - An array of collectors
 * @public
 */
StatusCollector.prototype.collectors = function(glob) {
  var self = this;
  if(!glob) {
    return _.values(this._collectors);
  } else {
    return Object.keys(this._collectors).filter(function(key) {
      return minimatch(key, glob)
    }).map(function(key) { return self._collectors[key]; });
  }
};

StatusCollector.prototype.connectApp = function(glob) {
  var app = require('connect')(),
      self = this


  statusCollector.register('status-collector.test.bad', function() {
    return { success: false, bad: 'juju' };
  });

  statusCollector.register('status-collector.test.good', function() {
    return { success: true, good: 'juju' };
  });

  app.get(/^\/status(\/(.+)?)?$/, function(req, res, next) {
    var path = req.params[1] || '*';
    statusCollector.execute(path)
    .then(function(results) {
      var status = 200;
      if(_.some(results, {'success': false})) status = 500;

      res.json(status, results);
    });
  });
  return app;
};

module.exports = new StatusCollector();
