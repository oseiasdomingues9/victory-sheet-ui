import { UserManager, type User } from 'oidc-client-ts'
import { ref } from 'vue'

export const userManager = new UserManager({
  authority: 'http://65.21.107.37:9010',
  client_id: '380610079038177284',
  redirect_uri: 'http://localhost:5173/callback',
  response_type: 'code',
  scope: 'openid profile email',
})

export const currentUser = ref<User | null>(null)

export async function loadCurrentUser() {
  currentUser.value = await userManager.getUser()
  return currentUser.value
}

export async function logout() {
  await userManager.signoutRedirect({
    post_logout_redirect_uri: `${window.location.origin}/`,
  })
}

userManager.events.addUserLoaded((user) => (currentUser.value = user))
userManager.events.addUserUnloaded(() => (currentUser.value = null))