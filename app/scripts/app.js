/** @jsx React.DOM */

var chatHead = document.querySelector('.chatHead')
  , Physics = require('rk4')
  , Renderer = require('rk4/lib/renderer')
  , Velocity = require('touch-velocity')
  , Vector = window.Vector = require('rk4/lib/vector')

$(window).on('touchmove', function(e) {
  e.preventDefault()
})

function ChatHead() {
  this.startX = 0
  this.startY = 0
  this.deltaX = 0
  this.deltaY = 0
  this.mouseDown = false
  this.veloX = new Velocity
  this.veloY = new Velocity
  this.deleteJailed = false

  this.deleteRenderer = new Renderer([document.querySelector('.deleteTarget')])
    .style('translateX', function(pos) { return pos.x + 'px' })
    .style('translateY', function(pos) { return pos.y + 'px' })
    .style('scale', function(pos) {
      if(!pos.dist || pos.dist > 40)
        return .7
      return 1 - (.3 * (pos.dist / 40))
    })

  this.delIn = { x: $(window).width()/2 - 40, y: $(window).height() - 100, dist: 100 }
  this.delOut = { x: $(window).width()/2 - 40, y: $(window).height() + 100, dist: 100 }
  this.deleteRenderer.update(this.delOut)

  this.renderer = new Renderer([chatHead])
    .style('translateX', function(pos) { return pos.x + 'px' })
    .style('translateY', function(pos) { return pos.y + 'px' })

  this.delPhys = new Physics(this.deleteRenderer.update.bind(this.deleteRenderer))
  this.phys = new Physics(this.setPosition.bind(this))

  chatHead.addEventListener('touchstart', this.start.bind(this))
  chatHead.addEventListener('touchmove', this.move.bind(this))
  chatHead.addEventListener('touchend', this.end.bind(this))
}

ChatHead.prototype.setPosition = function(pos) {
  this.deltaX = pos.x
  this.deltaY = pos.y

  var delPos = this.deleteRenderer.currentPosition
  var dist = Vector(delPos.x, delPos.y).sub(Vector(pos.x, pos.y)).norm()

  this.deleteRenderer.update({ x: delPos.x, y: delPos.y, dist: dist })
  this.renderer.update(pos)
}

ChatHead.prototype.start = function(evt) {
  this.mouseDown = true
  this.phys.cancel()
  this.delPhys.cancel()

  var delPos = this.deleteRenderer.currentPosition
  this.delPhys.spring(0, delPos, this.delIn, { b: 20, k: 200 })
  .then(function() {
    console.log('in')
  })

  this.startX = evt.touches[0].pageX - this.deltaX
  this.startY = evt.touches[0].pageY - this.deltaY

  this.veloX.reset()
  this.veloY.reset()
}

ChatHead.prototype.move = function(evt) {
  evt.preventDefault()
  if(this.mouseDown) {
    var pos = {
      x: evt.touches[0].pageX - this.startX,
      y: evt.touches[0].pageY - this.startY
    }

    var delPos = this.deleteRenderer.currentPosition
    var dist = Vector(delPos.x, delPos.y).sub(Vector(pos.x, pos.y)).norm()
    if(dist < 100) {
      if(!this.deleteJailed) {
        this.phys.spring(800, pos, { x: delPos.x - 2, y: delPos.y - 2 }, { k: 400, b: 20 })
      }
      this.deleteJailed = true
      return
    }

    if(this.deleteJailed) {
      this.phys.cancel()
    }
    this.deleteJailed = false

    this.setPosition(pos)

    this.renderer.update({ x: this.deltaX, y: this.deltaY })

    this.veloX.updatePosition(this.deltaX)
    this.veloY.updatePosition(this.deltaY)
  }
}

ChatHead.prototype.remove = function(start, velocity) {
  var delPos = this.deleteRenderer.currentPosition
    , that = this

  this.phys.cancel()
  this.delPhys.cancel()
  this.phys.accelerate(velocity.norm(), start, delPos, { acceleration: 5000 })
  .then(function(state) {
    var phys = new Physics(function(pos) {
      pos.dist = 0
      that.deleteRenderer.update(pos)
      that.setPosition(pos)
    })
    phys.accelerate(Math.abs(state.velocity.norm()), delPos, { x: delPos.x, y: height + 100 }, { acceleration: 1000 })
    .then(function() {
      console.log('removed')
    })
  })
}

ChatHead.prototype.end = function(evt) {
  this.mouseDown = false

  var velocity = Vector(this.veloX.getVelocity(), this.veloY.getVelocity())
    , start = Vector(this.deltaX, this.deltaY)
    , end = intersect(start.clone(), velocity)
    , delPos = this.deleteRenderer.currentPosition

  if(this.deleteJailed || end.sub(Vector(delPos)).norm() < 100)
    return this.remove(start, velocity)


  this.phys.spring(velocity, start, end, { b: 10, k: 90 })
  this.delPhys.spring(200, delPos, this.delOut, { b: 20, k: 200 })
}

var width = $(window).width() - $(chatHead).width()
  , height = $(window).height() - 100

function yIntersect(y, point, direction) {
  var factor = (y - point.y) / direction.y
  return point.add(direction.clone().mult(factor))
}

function xIntersect(x, point, direction) {
  var factor = (x - point.x) / direction.x
  return point.add(direction.clone().mult(factor))
}

function pointBetween(p, p1, p2) {
  return p >= p1 && p <= p2
}

function intersect(point, velocity) {
  var direction = velocity.clone().normalize()
    , isect
    , distX
    , distY

  if(velocity.y < -100)
    isect = yIntersect(0, point, direction)
  if(velocity.y > 100)
    isect = yIntersect(height, point, direction)

  if(isect && pointBetween(isect.x, 0, width))
    return isect

  if(velocity.x < -100)
    isect = xIntersect(0, point, direction)
  if(velocity.x > 100)
    isect = xIntersect(width, point, direction)

  if(isect && pointBetween(isect.y, 0, height))
    return isect

  //if the velocity is zero, or it didn't intersect any lines (outside the box)
  //just send it it the nearest boundry
  distX = (Math.abs(point.x) < Math.abs(point.x - width)) ? 0 : width
  distY = (Math.abs(point.y) < Math.abs(point.y - height)) ? 0 : height

  return (distX < distY) ? Vector(distX, point.y) : Vector(point.x, distY)
}

new ChatHead()