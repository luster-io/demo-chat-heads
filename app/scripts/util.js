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

function intersect(point, velocity, left, right, top, bottom) {
  var direction = velocity.clone().normalize()
    , isect
    , distX
    , distY

  if(velocity.y < -100)
    isect = yIntersect(top, point, direction)
  if(velocity.y > 100)
    isect = yIntersect(bottom, point, direction)

  if(isect && pointBetween(isect.x, left, right))
    return isect

  if(velocity.x < -100)
    isect = xIntersect(left, point, direction)
  if(velocity.x > 100)
    isect = xIntersect(right, point, direction)

  if(isect && pointBetween(isect.y, top, bottom))
    return isect

  //if the velocity is zero, or it didn't intersect any lines (outside the box)
  //just send it it the nearest boundry
  distX = (Math.abs(point.x - left) < Math.abs(point.x - right)) ? left : right
  distY = (Math.abs(point.y - top) < Math.abs(point.y - bottom)) ? top : bottom

  return (distX < distY) ? Vector(distX, point.y) : Vector(point.x, distY)
}

module.exports = {
  intersect: intersect
}
// function xIntersect(x, point, direction) {
//   var factor = (x - point.x) / direction.x
//   return point.add(direction.clone().mult(factor))
// }

// function pointBetween(p, p1, p2) {
//   return p >= p1 && p <= p2
// }

// function intersect(point, velocity, left, right, top, bottom) {
//   var direction = velocity.clone().normalize()
//     , isect
//     , nearest

//   if(velocity === 0 || point.x > right || point.x < left) {
//     nearest = (Math.abs(point.x - left) < Math.abs(point.x - right)) ? left : right
//     isect = Vector(nearest, point.y)
//   } else if(velocity.x < -0)
//     isect = xIntersect(left, point, direction)
//   else if(velocity.x > 0)
//     isect = xIntersect(right, point, direction)

//   console.log(isect)
//   isect.y = Math.max(top, Math.min(bottom, isect.y))

//   return isect
// }

// module.exports = {
//   intersect: intersect
// }
