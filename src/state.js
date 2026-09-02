// The signed-in Firebase user, shared between the shell and the views that
// need to stamp uploads with an author.
let user = null;

export function setCurrentUser(next) {
  user = next;
}

export function currentUser() {
  return user;
}
