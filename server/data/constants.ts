export const transferPrisonId = 'TRN' as const
export type TransferPrisonId = typeof transferPrisonId

export const outsidePrisonId = 'OUT' as const
export type OutsidePrisonId = typeof outsidePrisonId

/** All user require role PRISON to access this site */
export const userRolePrison = 'ROLE_PRISON' as const
/** Users require role NON_ASSOCIATIONS to add, update or close non-associations */
export const userRoleManageNonAssociations = 'ROLE_NON_ASSOCIATIONS' as const
