/**
 * Pure function: generates rest schedule for a shift.
 * No DB access.
 */

function roundToMinute(date) {
  const ms = date.getTime()
  return new Date(Math.round(ms / 60000) * 60000)
}

function minutesBetween(a, b) {
  return (b.getTime() - a.getTime()) / 60000
}

/**
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {Array<{type: string, scheduledTime: Date, status: string}>}
 */
export function generateRestSchedule(startTime, endTime) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const shiftLengthHours = (end - start) / (1000 * 60 * 60)

  if (shiftLengthHours < 4.0) {
    return []
  }

  let rests = []

  if (shiftLengthHours < 6.0) {
    // 4.0–5.99h: one BREAK at midpoint
    const midpoint = new Date(start.getTime() + (end - start) / 2)
    rests = [{ type: 'BREAK', scheduledTime: roundToMinute(midpoint) }]
  } else if (shiftLengthHours < 7.5) {
    // 6.0–7.49h: BREAK at start+2h, LUNCH at end-2h
    const breakTime = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    const lunchTime = new Date(end.getTime() - 2 * 60 * 60 * 1000)
    const gap = minutesBetween(breakTime, lunchTime)
    if (gap < 60) {
      // Redistribute evenly
      const midpoint = new Date(start.getTime() + (end - start) / 2)
      const third = (end - start) / 3
      const b = new Date(start.getTime() + third)
      const l = new Date(start.getTime() + 2 * third)
      rests = [
        { type: 'BREAK', scheduledTime: roundToMinute(b) },
        { type: 'LUNCH', scheduledTime: roundToMinute(l) },
      ]
    } else {
      rests = [
        { type: 'BREAK', scheduledTime: roundToMinute(breakTime) },
        { type: 'LUNCH', scheduledTime: roundToMinute(lunchTime) },
      ]
    }
  } else {
    // 7.5h+: BREAK at start+2h, LUNCH at start+4h, BREAK at end-2h
    const break1Time = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    const lunchTime = new Date(start.getTime() + 4 * 60 * 60 * 1000)
    const break2Time = new Date(end.getTime() - 2 * 60 * 60 * 1000)

    // Check for conflicts (< 60 min gaps)
    const gap1 = minutesBetween(break1Time, lunchTime)
    const gap2 = minutesBetween(lunchTime, break2Time)

    if (gap1 < 60 || gap2 < 60) {
      // Redistribute evenly into 4 equal segments
      const quarter = (end - start) / 4
      const b1 = new Date(start.getTime() + quarter)
      const l = new Date(start.getTime() + 2 * quarter)
      const b2 = new Date(start.getTime() + 3 * quarter)
      rests = [
        { type: 'BREAK', scheduledTime: roundToMinute(b1) },
        { type: 'LUNCH', scheduledTime: roundToMinute(l) },
        { type: 'BREAK', scheduledTime: roundToMinute(b2) },
      ]
    } else {
      rests = [
        { type: 'BREAK', scheduledTime: roundToMinute(break1Time) },
        { type: 'LUNCH', scheduledTime: roundToMinute(lunchTime) },
        { type: 'BREAK', scheduledTime: roundToMinute(break2Time) },
      ]
    }
  }

  // Clamp to shift bounds
  return rests
    .filter(r => r.scheduledTime >= start && r.scheduledTime <= end)
    .map(r => ({ ...r, status: 'SCHEDULED' }))
}
