var expect = require('chai').expect,
    sinon = require('sinon'),
    _ = require('lodash'),
    statusCollector = require('../index');

describe('StatusCollector', function() {
  var existingCollectors; 
  beforeEach(function() { 
    existingCollectors = statusCollector.collectors();
    statusCollector.reset();
  });

  afterEach(function() {
    statusCollector.reset();
    existingCollectors.forEach(function(c) { statusCollector.register(c.name, c.fn); });
  });


  describe('registering a collector', function() {
    it('registers a collector', function() { 
      var fn = function() {}, 
          collector = statusCollector.register('my.cool.collector', fn );

      expect(collector.name).to.equal('my.cool.collector');
      expect(collector.fn).to.equal(fn);
    });

    it('overwrites a collector', function() {
      var fn1 = function() {},
          fn2 = function() {},
          collector1 = statusCollector.register('my.cool.collector', fn1 ),
          collector2 = statusCollector.register('my.cool.collector', fn2 ),
          collectors = statusCollector.collectors('my.cool.collector');

      expect(collectors.length).to.eql(1);
    });
  });

  describe('collectors', function() {
    var a,b,c;

    beforeEach(function() {
      var noop = function(){};

      a = statusCollector.register('my.cool.collector', noop);
      b = statusCollector.register('my.cool.thing', noop);
      c = statusCollector.register('my.bad.collector', noop);
    });

    it('selects the appropriate collectors', function() {
      it('selects exact globs', function() {
        var collectors = statusCollector.collectors('my.cool.thing');
        expect(collectors.length).to.eql(1);
        expect(collectors[0]).to.eql(a);
      });

      it('selects based on globs', function() {
        var collectors = statusCollector.collectors('my.*.collector');
        expect(collectors.length).to.eql(2);
        expect(_.contains(collectors, a)).to.be.true;
        expect(_.contains(collectors, c)).to.be.true;

        var collectors = statusCollector.collectors('my.*');
        expect(collectors.length).to.eql(3);
      });
    });
  });
  
  describe('executing collectors', function() {
    var a,b,c;

    beforeEach(function() {
      var fn = function() { return {success: true, done: 'yeah' }; };

      a = statusCollector.register('my.cool.collector', fn);
      b = statusCollector.register('my.cool.thing', fn);
      c = statusCollector.register('my.bad.collector', fn);
    });

    it('executes only selected things', function(done) {
      statusCollector.execute('my.cool.*')
      .then(function(results) {

        var names = _.pluck(results, 'name');
        expect(names).to.eql(['my.cool.collector', 'my.cool.thing']);
        expect(results[0]).to.eql({
          success: true,
          name: 'my.cool.collector',
          results: { success: true, done: 'yeah' }
        });
        done();
      }).catch(done).done();
    });

    it('handles exceptions', function(done) {
      var e = new Error('ouch');
      statusCollector.register('my.bad.thrower', function() { throw e; });

      statusCollector.execute('my.bad.*')
      .then(function(results) {
        expect(results.length).to.eql(2);

        expect(results[0].name).to.eql('my.bad.collector');
        expect(results[0].success).to.be.true;
        expect(results[0].results).to.eql({success: true, done: 'yeah'});

        expect(results[1].name).to.eql('my.bad.thrower');
        expect(results[1].success).to.be.false;
        expect(results[1].results).to.be.undefined;
        expect(results[1].error).to.equal(e);
        done();
      }).catch(done).done();
    });
  });
});
