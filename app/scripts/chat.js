var Physics = require('rk4')
  , Renderer = require('rk4/lib/renderer')

function ChatBox() {
  this.el = document.querySelector('.chat')
  this.renderer = new Renderer([this.el])
    .style('opacity', function(pos) { return pos.y / 1000 })
    .style('translateX', function(pos) { return (pos.x < 3) ? '-9999px' : '0' })

  this.phys = new Physics(this.renderer.update.bind(this.renderer))
  this.closed = true
}

ChatBox.prototype.open = function() {
  if(this.closed) {
    this.phys.cancel()
    this.phys.spring(0, { x: 0, y: 0 }, { x: 1000, y: 1000 }, { k: 400, b: 28 })
  }
  this.closed = false
}

ChatBox.prototype.close = function() {
  if(!this.closed) {
    this.phys.cancel()
    this.phys.spring(0, { x: 1000, y: 1000 }, { x: 0, y: 0 }, { k: 400, b: 28 })
  }
  this.closed = true
}

window.ChatBox = module.exports = ChatBox