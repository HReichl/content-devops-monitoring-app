// Require and call Express
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const prom = require('prom-client');

// HRx - Collect default metrics
const collectDefaultMetrics = prom.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'todolist_' });

// HRx - Prometheus metric definitions
const todocounter = new prom.Counter({
  name: 'hrx_todolist_number_of_todos_total',
  help: 'The number of items added to the to-do list, total'
});

// HRx - New gauge for active tasks
const todogauge = new prom.Gauge ({
  name: 'hrx_todolist_current_todos',
  help: 'Amount of incomplete tasks'
});

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// use css
app.use(express.static("public"));

// placeholder tasks
var task = [];
var complete = [];

// add a task
app.post("/addtask", function(req, res) {
  var newTask = req.body.newtask;
  task.push(newTask);
  res.redirect("/");
  todocounter.inc();   // HRx
  todogauge.inc()      // HRx
});

// remove a task
app.post("/removetask", function(req, res) {
  var completeTask = req.body.check;
  if (typeof completeTask === "string") {
    complete.push(completeTask);
    task.splice(task.indexOf(completeTask), 1);
    todogauge.dec()      // HRx
  }
  else if (typeof completeTask === "object") {
    for (var i = 0; i < completeTask.length; i++) {
      complete.push(completeTask[i]);
      task.splice(task.indexOf(completeTask[i]), 1);
      todogauge.dec()      // HRx
    }
  }
  res.redirect("/");
});

// get website files
app.get("/", function (req, res) {
  res.render("index", { task: task, complete: complete });
});

// HRx - Add metrics endpoint
app.get('/metrics', function (req, res) {
   res.set('Content-Type', prom.register.contentType);
   res.end(prom.register.metrics());
});

// listen for connections
app.listen(8080, function() {
  console.log('Testing app listening on port 8080')
});
