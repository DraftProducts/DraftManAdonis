'use strict'

class RedirectIfAuthenticated {
  async handle ({ auth, response }, next) {
    /**
     * Verify if we are logged in.
     *
     * ref: http://adonisjs.com/docs/4.0/authentication#_check
     */
    try {
      await auth.check()

      return response.redirect('/me/')
    } catch (e) {}

    await next()
  }
}

module.exports = RedirectIfAuthenticated
