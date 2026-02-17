export class RestTransitionError extends Error {
  constructor(currentStatus, targetStatus) {
    super(
      `Invalid rest status transition: ${currentStatus} -> ${targetStatus}`
    )
    this.name = 'RestTransitionError'
    this.currentStatus = currentStatus
    this.targetStatus = targetStatus
  }
}

const ALLOWED_TRANSITIONS = {
  SCHEDULED: ['DUE', 'OUT'],
  DUE: ['OUT'],
  OUT: ['COMPLETED'],
  COMPLETED: ['OUT'], // manual override only
}

/**
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @param {boolean} [isManualOverride]
 * @returns {string} targetStatus
 * @throws {RestTransitionError}
 */
export function transitionRestStatus(currentStatus, targetStatus, isManualOverride = false) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []

  if (!allowed.includes(targetStatus)) {
    throw new RestTransitionError(currentStatus, targetStatus)
  }

  // COMPLETED -> OUT requires manual override
  if (currentStatus === 'COMPLETED' && targetStatus === 'OUT' && !isManualOverride) {
    throw new RestTransitionError(currentStatus, targetStatus)
  }

  return targetStatus
}

/**
 * @param {object} restPeriod
 * @param {Date} now
 * @returns {boolean}
 */
export function shouldAutoDue(restPeriod, now) {
  return (
    restPeriod.status === 'SCHEDULED' &&
    new Date(now) >= new Date(restPeriod.scheduledTime)
  )
}
