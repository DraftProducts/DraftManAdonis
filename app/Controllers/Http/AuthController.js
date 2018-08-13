'use strict'

const { validate } = use('Validator')
const User = use('App/Models/User')
const Emails = use('App/Models/Email')
const Mail = use('Mail')

class AuthController {
  async register({ session, request, response }) {

    const messages = {
      'username.required': 'Veuillez indiquer votre pseudo.',
      'email.required': 'Veuillez entrer une adresse email valide.',
      'email.email': 'Veuillez entrer une adresse email valide.',
      'username.unique': 'Ce pseudo est déjà utilisé.',
      'email.unique': 'Cette adresse email est déjà utilisé.',
      'password.required': 'Veuillez indiquer votre mot de passe.',
      'password_conf.required_if': 'Veuillez répéter votre mot de passe.',
      'password_conf.same': 'Veuillez mettre le même mot de passe.'
    }

    const rules = {
      username: 'required|unique:users',
      email: 'required|email|unique:users',
      password: 'required',
      password_conf: 'required_if:password|same:password',
    }

    const data = request.only(['username', 'email', 'password', 'password_conf'])
    data.role = 0;

    const validation = await validate(request.all(), rules, messages)

    if (validation.fails()) {
      session
        .withErrors(validation.messages())
        .flashExcept(['password_conf'])

      return response.redirect('back')
    }

    delete data.password_conf

    
    await User.create(data)
    await Emails.findOrCreate({ email: data.email },{ email: data.email })
    
    session.flash({
      account_created: 'Compte crée avec succès'
    })
    
    await Mail.send('mails/inscription', data, (message) => {
      message
        .to('<email>')
        .from('no-reply@draftman.fr', 'draftman.fr')
        .subject('Inscription sur DraftMan.fr')
        .replyTo('contact@draftman.fr', 'DraftMan')
    })

    return response.redirect('/login')
  }

  async login({ auth, request, response, session }) {
    const {email, password} = request.only(['email','password'])

    const messages = {
      'email.required': 'Veuillez entrer une adresse email valide.',
      'email.email': 'Veuillez entrer une adresse email valide.',
      'password.required': 'Veuillez indiquer votre mot de passe.',
    }

    const rules = {
      email: 'required|email',
      password: 'required',
    }

    const validation = await validate(request.all(), rules, messages)

    if (validation.fails()) {
      session
        .withErrors(validation.messages())
        .flashExcept(['password'])

      return response.redirect('back')
    }

    try {
      await auth.remember(true).attempt(email, password);
    } catch (e) {
      session.flashExcept(['password'])
      session.flash({error: 'Identifiant ou mot de passe incorect'})
      return response.redirect('back')
    }

    return response.redirect('/me/')
  }

  logout({auth, session, response}) {
    return Promise.all([
      session.clear(),
      auth.logout()
    ]).then(() => {
      session.flash({
        account_logout: 'Vous vous êtes déconnecté avec succès'
      })
      return response.redirect("/login");
    }).catch(err => console.log(err));
  }
}
module.exports = AuthController