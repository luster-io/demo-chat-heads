/** @jsx React.DOM */

var Physics = require('rk4')
  , Renderer = require('rk4/lib/renderer')
  , Velocity = require('touch-velocity')
  , eventEmitter = require('events')
  , Vector = window.Vector = require('rk4/lib/vector')
  , width = $(window).width() - 100
  , height = $(window).height() - 100
  , intersect = require('./util').intersect
  , ChatBox = require('./chat')
  , chatBox = new ChatBox()
  , Promise = Promise || require('promise')

$(window).on('touchmove', function(e) {
  e.preventDefault()
})

function TrailingHead(el, leadingHead) {
  this.renderer = new Renderer([el])
    .style('translateX', function(pos) { return pos.x + 'px' })
    .style('translateY', function(pos) { return pos.y + 'px' })

  this.phys = new Physics(this.setPosition.bind(this))
  this.leadingHead = leadingHead
  this.position = this.leadingHead.position

  this.follow()
}

TrailingHead.prototype = new eventEmitter()

TrailingHead.prototype.follow = function() {
  this.phys.cancel()
  var spring = this.phys.infiniSpring(0, this.leadingHead.position, { k: 600, b: 30 })

  this.leadingHead.on('position', function(pos) {
    spring.setDestination(Vector(pos))
  })
}

TrailingHead.prototype.setPosition = function(pos) {
  pos = Vector(pos)
  this.position = pos
  pos.x += 2
  this.emit('position', pos)
  this.renderer.update(pos)
}

function ChatHead(els) {
  this.startX = 0
  this.startY = 0
  this.deltaX = 0
  this.deltaY = 0
  this.mouseDown = false
  this.veloX = new Velocity
  this.veloY = new Velocity
  this.deleteJailed = false

  this.position = Vector(0, 0)

  var el = els[els.length - 1]
    , head = this

  this.chatHeads = [this]

  for(var i = els.length - 2 ; i >= 0 ; i--) {
    head = new TrailingHead(els[i], head)
    this.chatHeads.push(head)
  }

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

  this.renderer = new Renderer([el])
    .style('translateX', function(pos) { return pos.x + 'px' })
    .style('translateY', function(pos) { return pos.y + 'px' })

  this.delPhys = new Physics(this.deleteRenderer.update.bind(this.deleteRenderer))
  this.phys = new Physics(this.setPosition.bind(this))

  el.addEventListener('touchstart', this.start.bind(this))
  el.addEventListener('touchmove', this.move.bind(this))
  el.addEventListener('touchend', this.end.bind(this))
}

ChatHead.prototype = new eventEmitter()

ChatHead.prototype.setPosition = function(pos) {
  this.deltaX = pos.x
  this.deltaY = pos.y

  var delPos = this.deleteRenderer.currentPosition
  var dist = Vector(delPos).sub(Vector(pos)).norm()
  this.deleteRenderer.update({ x: delPos.x, y: delPos.y, dist: dist })
  this.renderer.update(pos)
  this.position = Vector(pos)
  this.emit('position', pos)
}

ChatHead.prototype.start = function(evt) {
  chatBox.close()

  this.mouseDown = true
  this.moved = false
  this.phys.cancel()
  this.delPhys.cancel()

  this.startX = evt.touches[0].pageX - this.deltaX
  this.startY = evt.touches[0].pageY - this.deltaY

  this.veloX.reset()
  this.veloY.reset()
}

ChatHead.prototype.move = function(evt) {
  evt.preventDefault()
  if(this.mouseDown) {
    if(!this.moved) {
      this.fannedOut = false
      var delPos = this.deleteRenderer.currentPosition
      this.delPhys.spring(0, delPos, this.delIn, { b: 20, k: 200 })
      this.chatHeads.forEach(function(head, i) {
        if(head.follow) head.follow()
      })
    }
    this.moved = true
    var pos = {
      x: evt.touches[0].pageX - this.startX,
      y: evt.touches[0].pageY - this.startY
    }

    var delPos = this.deleteRenderer.currentPosition
    var dist = Vector(delPos).sub(Vector(pos)).norm()
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
  })
}

ChatHead.prototype.fanOut = function(evt) {
  this.fannedOut = true
  var promises = this.chatHeads.map(function(head, i) {
    head.phys.cancel()
    return head.phys.spring(
      200,
      head.position,
      { x: width - (i * 70), y: 0 },
      { b: 30, k: 300 }
    )
  })
  Promise.race(promises)
  .then(function() {
    chatBox.open()
  })
}

ChatHead.prototype.end = function(evt) {
  this.mouseDown = false
  if(!this.moved && !this.fannedOut) {
      this.fanOut()
      return
  }
  if(!this.moved && this.fannedOut) {
    this.fannedOut = false
    this.chatHeads.forEach(function(head, i) {
      if(head.follow) head.follow()
    })
    return
  }

  var velocity = Vector(this.veloX.getVelocity(), this.veloY.getVelocity())
    , start = Vector(this.deltaX, this.deltaY)
    , end = intersect(start.clone(), velocity, 0, width, 0, height)
    , delPos = this.deleteRenderer.currentPosition

  if(this.deleteJailed || end.sub(Vector(delPos)).norm() < 100)
    return this.remove(start, velocity)

  this.delPhys.cancel()
  this.phys.cancel()
  this.phys.spring(velocity, start, end, { b: 30, k: 300 })
  this.delPhys.spring(200, delPos, this.delOut, { b: 20, k: 200 })
}

var c = new ChatHead(document.querySelectorAll('.chatHead'))