parser = require "./parser"
DLList = require "./DLList"
BottleneckError = require "./BottleneckError"

class Local
  constructor: (options, @instance) ->
    parser.load options, options, @
    @_nextRequest = Date.now()
    @_running = 0
    @_unblockTime = 0
    @_ready = @yieldLoop()

  yieldLoop: -> new @instance.Promise (resolve, reject) -> setTimeout resolve, 0

  computePenalty: -> @penalty ? ((15 * @minTime) or 5000)

  __updateSettings__: (options) ->
    await @yieldLoop()
    parser.overwrite options, options, @
    true

  __running__: ->
    await @yieldLoop()
    @_running

  conditionsCheck: (weight) ->
    ((not @maxConcurrent? or @_running+weight <= @maxConcurrent) and
    (not @reservoir? or @reservoir-weight >= 0))

  __incrementReservoir__: (incr) ->
    await @yieldLoop()
    @reservoir += incr

  __currentReservoir__: ->
    await @yieldLoop()
    @reservoir

  isBlocked: (now) -> @_unblockTime >= now

  check: (weight, now) -> @conditionsCheck(weight) and (@_nextRequest-now) <= 0

  __check__: (weight) ->
    await @yieldLoop()
    @check weight, Date.now()

  __register__: (weight) ->
    now = Date.now()
    if @conditionsCheck weight
      @_running += weight
      if @reservoir? then @reservoir -= weight
      wait = Math.max @_nextRequest-now, 0
      @_nextRequest = now + wait + @minTime
      { success: true, wait }
    else { success: false }

  __submit__: (queueLength, weight) ->
    if @maxConcurrent? and weight > @maxConcurrent
      throw new BottleneckError("Impossible to add a job having a weight of #{weight} to a limiter having a maxConcurrent setting of #{@maxConcurrent}")
    now = Date.now()
    reachedHighWaterMark = @highWater? and queueLength == @highWater and not @check(weight, now)
    blocked = @strategy == @instance.strategy.BLOCK and (reachedHighWaterMark or @isBlocked now)
    if blocked
      @_unblockTime = now + @computePenalty()
      @_nextRequest = @_unblockTime + @minTime
    { reachedHighWaterMark, blocked, strategy: @strategy }

  __free__: (weight) ->
    @_running -= weight
    { running: @_running }

module.exports = Local