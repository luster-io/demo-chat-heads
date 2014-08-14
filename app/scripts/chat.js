var Physics = require('rk4')
  , Renderer = require('rk4/lib/renderer')

function ChatBox() {
  this.el = document.querySelector('.chat')
  this.phys = new Physics([this.el])
    .style('opacity', function(pos) { return pos.y / 1000 })
    .style('scale', function(pos) { return pos.x / 1000 })

  this.closed = true
}

ChatBox.prototype.open = function() {
  if(this.closed) {
    this.phys.spring({ tension: 400, damping: 28 })
      .from(0, 0).to(1000, 1000).start()
  }
  this.closed = false
}

ChatBox.prototype.close = function() {
  if(!this.closed) {
    this.phys.spring({ tension: 400, damping: 28 })
      .from(1000, 1000).to(0, 0).start()
  }
  this.closed = true
}

window.ChatBox = module.exports = ChatBox