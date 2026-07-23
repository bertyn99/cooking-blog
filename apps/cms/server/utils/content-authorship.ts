/** Stamp creator/updater on content rows from the session user. */
export function authorshipOnCreate(userId: number) {
  return {
    createdByUserId: userId,
    updatedByUserId: userId,
  }
}

export function authorshipOnUpdate(userId: number) {
  return {
    updatedByUserId: userId,
  }
}
