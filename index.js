#!/usr/bin/env node
(function () {
  "use strict";

  // map auto_home          0         0         0   100%    /home
  var exec = require('child_process').exec
    , os = require('os')
    , reCaptureCells = /^([^\s]+\s?[^\s]+)\s+([a-zA-Z0-9]+)\s+([a-zA-Z0-9]+)\s+([a-zA-Z0-9]+)\s+(\d+)%\s+[^/]*(.*?)\s*$/
    , cmdMap = {
          "Darwin": "df -b"
        , "Linux": "df -B 512"
      }
    , reMap = {
          "Darwin": reCaptureCells
        , "Linux": reCaptureCells
      }
    , cmdDf = cmdMap[os.type()]
    , reDf = reMap[os.type()]
    ;

  function sizeToByte(string, size) {
    var conversion = 1;
    if(size === 'TB' || string.indexOf('T') !== -1) {
      conversion = 1099511627776;
    } else if(size === 'GB' || string.indexOf('G') !== -1) {
      conversion = 1073741824;
    } else if(size === 'MB' || string.indexOf('M') !== -1) {
      conversion = 1048576;
    } else if(size === 'KB' || string.indexOf('K') !== -1) {
      conversion = 1024;
    }

    return parseInt(string) * conversion;
    // TODO test default block size
  }

  function df(cb) {
    function formatDf(err, stdout, stderr) {
      var table,
          infos = [];

      function parseRow(row) {
        var cells = row.match(reDf);

        if (!cells || row.indexOf('Filesystem') !== -1) {
          return;
        }
        // FYI
        // It seems that RegExp Match isn't a true array
        // popping it deos weird things
        infos.push({
            filesystem: cells[1]
          , storage: sizeToByte(cells[2])
          , used: sizeToByte(cells[3])
          , available: sizeToByte(cells[4])
          , percent: parseInt(cells[5], 10)
          , mountpoint: cells[6]
        });
      }

      if (err) {
        cb(err);
        return;
      }

      if (stderr) {
        cb(new Error(stderr));
        return;
      }

      table = stdout.split(/\n/g);
      // get rid of header

      table.pop();
      table.forEach(parseRow);

      cb(null, infos);
    }

    exec('df -kh', formatDf);
  }

  function main () {
    df(function (err, table) {
      if (err) {
        console.error(err.stack);
        return;
      }   

      console.log(JSON.stringify(table, null, '  '));
    })
  }

  if (require.main === module) {
      main();
  }

  module.exports = df;
}());
