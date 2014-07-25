# Status Collector

This package allows packages and applications to setup status collectors into a global place. 
It allows you to setup topographically named collectors that can be filtered by globbing which can then be exposed for consumption to check the status of your application.

## Example

    > collectors = require('status-collector'),
    collectors = require('./index');
    > Q = require('q');
    > inspect = require('util').inspect;

    collectors.register('my.cool.collector', function() { return { success: true, stuff: 'and', things: true }; });
    collectors.register('my.ace.collector', function() { return Q().then(function() { return { success: true, woa: 'crazy'}; }); });

    > collectors
    <StatusCollector collectors=[my.ace.collector, my.cool.collector]>

Now to use them.

    # run everything
    collectors.execute().then(function(results) {
      console.log(inspect(results, {depth: null}));
    });

    > [ { name: 'my.cool.collector',
    success: true,
    results: { success: true, stuff: 'and', things: true } },
  { name: 'my.ace.collector',
    success: true,
    results: { success: true, woa: 'crazy' } } ]


We can filter the things to run:

    collectors.execute('*.cool.*').then(function(results) {
      console.log(inspect(results, {depth: null}));
    });

    > [ { name: 'my.cool.collector',
    success: true,
    results: { success: true, stuff: 'and', things: true } }

# Express integration

Add the following to your express app

    myApp.use(collectors.expressApp());

Then hit it:

    curl -k -vv  "http://localhost:4567/status/status-collector"
