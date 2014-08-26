/** @jsx React.DOM */

var Physics = require('impulse')
  , Vector = require('impulse/lib/vector')
  , width = $(window).width() - 70
  , height = $(window).height() - 90

require('./chat')

$(window).on('touchmove', function(e) {
  e.preventDefault()
})

function TrailingHead(el, leadingHead) {
  this.phys = new Physics(el)
    .style('translate', function(x, y) { return x + 'px, ' + y + 'px' })

  this.leadingHead = leadingHead
  this.follow()
}

TrailingHead.prototype.follow = function() {
  this.phys.attachSpring(this.leadingHead, {
    offset: { x: 2, y: 0 },
    tension: 700,
    damping: 35
  }).start()
}

function page(evt, axis) {
  var page = 'page' + axis.toUpperCase()
  return (evt.touches && evt.touches[0][page]) || evt[page]
}

function ChatHead(els) {
  this.deleteJailed = false

  var el = els[els.length - 1]
    , head = this

  var phys = window.phys = this.phys = new Physics(el)
    .style('translate', function(x, y) { return x + 'px, ' + y + 'px' })

  this.chatHeads = [this]
  this.boundry = Physics.Boundry({ top: 0, left: 0, bottom: height, right: width })

  for(var i = els.length - 2 ; i >= 0 ; i--) {
    head = new TrailingHead(els[i], head.phys)
    this.chatHeads.push(head)
  }

  this.delPhys = new Physics(document.querySelector('.deleteTarget'))
    .style({
      translate: function(x, y) { return x + 'px, ' + y + 'px' },
      scale: function(x, y) {
        var dist = phys.position().selfSub(x, y).norm()
        if(dist > 40)
          return .7
        return 1 - (.3 * (dist / 40))
      }
    })

  this.delIn = { x: $(window).width()/2 - 40, y: $(window).height() - 100 }
  this.delOut = { x: $(window).width()/2 - 40, y: $(window).height() + 100 }

  this.delPhys.position(this.delOut)

  el.addEventListener('touchstart', this.start.bind(this))
  el.addEventListener('touchmove', this.move.bind(this))
  el.addEventListener('touchend', this.end.bind(this))

  el.addEventListener('mousedown', this.start.bind(this))
  window.addEventListener('mousemove', this.move.bind(this))
  window.addEventListener('mouseup', this.end.bind(this))
}

ChatHead.prototype.start = function(evt) {
  evt.preventDefault()
  this.mouseDown = true
  this.moved = false

  this.interaction = phys.interact()

  this.interaction.start(evt)
  this.startX = page(evt, 'x')
  this.startY = page(evt, 'y')
  this.initialPosition = this.phys.position()
}

ChatHead.prototype.move = function(evt) {
  if(!this.mouseDown) return
  evt.preventDefault()
  if(!this.moved) {
    this.delPhys.spring({ damping: 20, tension: 200 })
      .to(this.delIn).start()
  }
  this.moved = true

  var delta = Vector({
    x: page(evt, 'x') - this.startX,
    y: page(evt, 'y') - this.startY
  })

  var that = this
  var pos = this.initialPosition.add(delta)
  var deletePosition = this.delPhys.position()
  var dist = deletePosition.sub(Vector(pos)).norm()

  if(dist < 60) {
    if(!this.deleteJailed) {
      this.interaction.end()
      this.phys.spring({ tension: 400, damping: 20 })
        .to(this.delIn.x - 2, this.delIn.y - 2)
        .start()
    }
    this.deleteJailed = true
  } else {
    if(this.deleteJailed) {
      this.phys.position(pos)
      this.interaction.start(evt)
      this.deleteJailed = false
    } else {
      this.interaction.update(evt)
    }
  }
}


ChatHead.prototype.remove = function(start, velocity) {
  var that = this

  var spring = this.phys.spring({ tension: 400, damping: 25 })
    .to(that.delIn)
    .start()
    .then(function() {
      setTimeout(function() {
        that.chatHeads.forEach(function(head) {
          head.phys.spring().to(that.delOut).start()
        })
        that.delPhys.spring().to(that.delOut).start()
      }, 200)
      that.chatHeads.forEach(function(head) {
        head.phys.spring().to(that.delOut).start()
      })
      that.delPhys.spring().to(that.delOut).start()
    })
}

ChatHead.prototype.end = function(evt) {
  if(!this.mouseDown) return
  evt.preventDefault()
  this.mouseDown = false

  this.interaction.end()
  var end = this.boundry.nearestIntersect(this.phys.position(), this.phys.velocity())

  var thrownTowardsDelete =
    Vector(end).sub(this.delPhys.position()).norm() < 100 &&
    this.phys.velocity().norm() > 200

  var nearDelete = this.phys.position().sub(this.delPhys.position()).norm() < 100

  if(this.deleteJailed || thrownTowardsDelete || nearDelete)
    return this.remove()

  this.phys.spring({ damping: 30, tension: 250 })
    .to(this.boundry).start()

  this.delPhys.spring({ damping: 20, tension: 200 })
    .to(this.delOut).start()
  return
}

var c = new ChatHead(document.querySelectorAll('.chatHead'))
