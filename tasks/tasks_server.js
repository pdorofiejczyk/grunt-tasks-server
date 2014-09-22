/*
 * grunt-tasks-server
 * https://github.com/pdorofiejczyk/grunt-tasks-server
 *
 * Copyright (c) 2014 Paweł Dorofiejczyk
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var express = require('express');

  var start = function(port) {
    var app = express();

    process.on('SIGTERM', function () {
      grunt.log.writeln("Closing");
      app.close();
    });

    var server = app.listen(port, function() {
      grunt.log.writeln('Listening on port %d', server.address().port);
    });

    return app;
  };

  var publishTasks = function(app, publicTasks) {
    grunt.log.writeln('publishTasks');

    app.get('/grunt/:tasks', function(req, res, next) {
      var tasks = req.params.tasks.split(',');

      for(var id in tasks) {
        var task = tasks[id],
            taskArgs = task.split(':');

        if(!grunt.task.exists(taskArgs[0]) || publicTasks.indexOf(taskArgs[0]) === -1) {
          grunt.log.writeln('[Server] Task "' + task + '" is not available.');
          res.json({
            'msg': 'Task "' + task + '" is not available.',
            'result': {}
          });

          return;
        }
      }

      grunt.log.writeln('[Server] Running tasks "' + tasks.join('", "') + '".' + "\n\n");

      grunt.util.spawn({grunt: true, args: tasks}, function(error, result, code) {
        grunt.log.writeln(result.toString());
        res.json({
          'msg': 'Tasks "' + tasks.join('", "') + '"" executed.',
          'result': {
            'out': result.toString(),
            'code': code,
          }
        });
      });
    });
  };

  grunt.registerMultiTask('tasks_server', 'Plugin which provides REST api for remote Grunt tasks execution.', function() {
    var options = this.options(),
        done = this.async(),
        app;

    app = start(options.port || 3000);

    app.on('close', done);

    publishTasks(app, options.tasks || []);
  });

};
