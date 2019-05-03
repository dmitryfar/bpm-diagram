// Raphael JS SVG Group 0.1
// Copyright (c) George I. 2011-2015
import Raphael from 'raphael'

(function() {
	"use strict";
	Raphael.fn.group = function(g) {
		if(Raphael.svg != true) {
      return;
    }
    var elements = [];
     Array.prototype.push.apply( elements, arguments );
    // // let id = elements.shift()
    // for(let i=0;i<arguments.length;i++) {
    //   if (Array.isArray(arguments[i])){
    //     Array.prototype.push.apply( elements, arguments[i] );
    //   } else {
    //     elements.push(arguments[i])
    //   }
    // }
    elements = flatten(elements)

    var paper = this;
    this.svg = "http://www.w3.org/2000/svg";
    this.dv = paper.canvas;
    var defs = this.defs;
    this.svgcanv = paper.canvas;
    paper.canvas.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    var countGroups = paper.canvas.getElementsByTagName("g").length;
    var createUUID=function(b,a){return function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(b,a).toUpperCase()}}(/[xy]/g,function(b){var a=16*Math.random()|0;return("x"==b?a:a&3|8).toString(16)});
    if(countGroups == 0) {
      this.masterGroup = document.createElementNS(this.svg, "g");
      paper.canvas.appendChild(this.masterGroup)
    }else {
      this.masterGroup = paper.canvas.getElementsByTagName("g")[0]
    }
    var group = document.createElementNS(this.svg, "g");
    for(let i = 0;i < elements.length;i++) {
      if (!elements[i]) {
        continue
      }
      elements[i].node.setAttribute('id', elements[i].id)
      paper.canvas.removeChild(elements[i].node)
      // let newNode = elements[i].clone().node
      group.appendChild(elements[i].node)
      // elements[i].node = newNode
    }
    this.masterGroup.appendChild(group);
    group.set = [];
    var _mg = this.masterGroup;
    group.getMaster = function() {
      return _mg
    };
    group.remove = function() {
      this.parentNode.removeChild(this)
    };
    /*group.click = function () {
      console.log('click')
      return this.click
    };*/
    var thisTransform = {translate:{x:0, y:0}, scale:{x:1, y:1}, rotate:{x:0, y:0, z:0}};
    var transformString = function() {
      return"translate(" + thisTransform.translate.x + "," + thisTransform.translate.y + ") scale(" + thisTransform.scale.x + "," + thisTransform.scale.y + ") rotate(" + thisTransform.rotate.x + "," + thisTransform.rotate.y + "," + thisTransform.rotate.z + ")"
    };
    group.translate = function(c, a) {
      thisTransform.translate.x = c;
      thisTransform.translate.y = a;
      this.setAttribute("transform", transformString())
    };
    group.rotate = function(c, a, e) {
      thisTransform.rotate.x = c;
      thisTransform.rotate.y = a;
      thisTransform.rotate.z = e;
      this.setAttribute("transform", transformString())
    };
    group.scale = function(c, a) {
      thisTransform.scale.x = c;
      thisTransform.scale.y = a;
      this.setAttribute("transform", transformString())
    };
    group.addElement = function() {
      for(let i = 0;i < arguments.length;i++) {
        arguments[i].node.setAttribute('id', arguments[i].id)
        paper.canvas.removeChild(arguments[i].node)
        this.appendChild(arguments[i].node)
      }
    };
    group.addNode = function() {
      for(let i = 0;i < arguments.length;i++) {
        this.appendChild(arguments[i])
      }
    };
    group.getAttr = function(c) {
      return thisTransform[c]
    };
    group.copy = function(el) {
      this.copy = el.node.cloneNode(true);
      this.appendChild(this.copy)
    };
    group.toFront = function(){
      this.getMaster().appendChild(this);
    };
    group.clipPath = function(c){
      var cp = document.createElementNS(svgHead, "clipPath");
      var cpID = createUUID();
      cp.setAttribute("id",cpID);
      cp.appendChild(c.node);
      defs.appendChild(cp);
      this.setAttribute("clip-path","url(#"+cpID+")")
    };

    group.animate = function(){
      var el = this;
      var args = arguments;
      var attrToAnimate = args[0];
      var duration = args[1];
      var callback = args[2];
      var timerx;
      if(typeof(timerx) !== 'undefined'){
        clearInterval(timerx);
      }
      var newPosx = attrToAnimate['x'];
      var original = el.getAttr('translate').x;
      var stepLen;
      timerx = setInterval(function(){if(original>newPosx){stepLen = (original - newPosx)/10;moveLeft()}else{stepLen = (newPosx - original)/10;moveRight()}},10);
      var currpos = original;
      function moveLeft(){
        if(el.getAttr('translate').x-stepLen>newPosx){
          el.translate(el.getAttr('translate').x-stepLen,0);
        }else{
          el.translate(newPosx,0);
          clearInterval(timerx);
          callback()
        }
      };
      function moveRight(){
        if(el.getAttr('translate').x+stepLen<newPosx){
          el.translate(el.getAttr('translate').x+stepLen,0);
        }else{
          el.translate(newPosx,0);
          clearInterval(timerx);
          callback()
        }
      }
    };
    return group
	};
  function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
  }
})();
