import p5 from "p5/lib/p5.min.js";
import Graph from "./graph.js";
import ui from "./ui.js";
import Net from "./net.js";

let canvas;
let net;
let num_clients;

let cur_graph;
let cur_demo;

let graph;
let scrubbing;
let scrub_pos;
let scrub_step;
let step_max;

let mousePressed;
let mouseGracePeriod;

const sketch = (p) => {
  p.setup = function() {
    let div = p.select('#p5canvas-holder');
    let ds = div.size();
    canvas = p.createCanvas(ds.width, ds.height);
    canvas.parent(div);
    canvas.mousePressed(onMousePressed);
    canvas.mouseReleased(onMouseReleased);

    window.p = p; // Make it accessible globally

    graph = new Graph(p.width,p.height);
    num_clients = 0;

    mousePressed = false;
    mouseGracePeriod = 0;

    graph.updateRanges([p.PI/2,1, -p.PI,5*p.PI, -1.2,1.2]);
    graph.updateGrid();

    scrubbing = false;
    scrub_pos = graph.ranges.display.min.x;
    step_max = p.width/40;

    function drawGraph(g) { cur_graph = g; graph.drawGraph(g.f); }
    function updateDemo(d) { cur_demo = d; net.emitData('demo', d.name); }
    function updateStep(v) {
      scrub_step = p.map(p.pow(v,3), 0.0,1.0, 0.0,step_max);
    }
    function playpause() {
      scrubbing = !scrubbing;
      mouseGracePeriod = 20;
    }

    ui.init();
    ui.addCallback('graph', drawGraph);
    ui.addCallback('demo', updateDemo);
    ui.addCallback('step', updateStep);
    ui.addCallback('play/pause', playpause);

    net = new Net(
      function onConnect() {
        ui.ready();
      },
      function onClient(c) {
        num_clients = c;
        ui.updateClientCount(num_clients);
      }
    );
  }

  p.draw = function() {
    if(cur_graph) {
      if(p.mouseIsPressed && p.mouseButton == p.RIGHT) {
        graph.drawGraph(cur_graph.f);
      }

      let selx = getX();
      // x can come from mouse, from scrubber or not come at all
      if(selx) {
        graph.drawSelection(selx);
        let x = graph.disToProj(selx,0)[0];
        let y = cur_graph.f(x);
        net.emitData('vals', [x,y]);
      }

      if(scrubbing) {
        scrub_pos += scrub_step;
        if(scrub_pos > graph.ranges.display.max.x) {
          scrub_pos = graph.ranges.display.min.x;
        }
      }
      else if(mouseGracePeriod > 0) {
        mouseGracePeriod -= 1;
      }
      p.image(graph.static_gb,0,0);
      p.image(graph.trace_gb,0,0);
      p.image(graph.marks_gb,0,0);
    } else {
      p.background(0);
      p.fill(255);
      p.textAlign(p.CENTER);
      p.text("Sem gráfico!", p.width/2, p.height/2);
    }
  }
}

function getX() {
  if(scrubbing) {
    return scrub_pos;
  } else if (mousePressed) {
    return p.mouseX;
  }
  return undefined;
}

function onMousePressed() {
  let t = mouseGracePeriod == 0 && p.mouseIsPressed;
  if(t) {
    mousePressed = true;
  } else {
    mousePressed = false;
  }
}

function onMouseReleased() {
  mousePressed = false;
}

new p5(sketch);

