'use strict'

const { validate } = use('Validator')
const User = use('App/Models/User')
const Mail = use('Mail')
const Helpers = use('Helpers')
const config = require('../../../config.json');
const { get, post } = require('snekfetch');
const btoa = require('btoa');

const CLIENT_ID = config.DISCORD_ID
const CLIENT_SECRET = config.DISCORD_SECRET
const cred = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
const redirect = encodeURIComponent('http://127.0.0.1:3333/discord/callback');

class ProfilController {
  async index({view}) {
    return view.render('dashboard.profil')
  }
  discordLogin({response}) {
    return response.redirect(`https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify+email&response_type=code&redirect_uri=${redirect}`);
  }

  async discordCallback({request,response,auth}) {
    const code = await request.get().code;
    const res = await post(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`).set('Authorization', `Basic ${cred}`)
    const resp = await get('https://discordapp.com/api/v6/users/@me').set('Authorization', `Bearer ${res.body.access_token}`)
    await User.query().where('id', auth.user.id).update({
      discord_username: resp.body.username,
      discord_discriminator: resp.body.discriminator,
      discord_email: resp.body.email,
      profil: `https://cdn.discordapp.com/avatars/${resp.body.id}/${resp.body.avatar}?size=256`
    })
    response.redirect('/me/profil')
  }

  async storeBasic({session, request, response,auth}){
    const data = request.only(['username', 'email', 'password', 'password_confirmation'])

    const image = request.file('image', {
      types: ['image'],
      size: '2mb'
    })

    const messages = {
      'email.email': 'Veuillez entrer une adresse email valide.',
      'username.unique': 'Ce pseudo est déjà utilisé.',
      'email.unique': 'Cette adresse email est déjà utilisé.',
      'password.confirmed': 'Veuillez répéter votre mot de passe.',
    }

    const rules = {
      email: 'email',
      password: 'confirmed'
    }

    const validation = await validate(data, rules, messages)

    if (validation.fails()) {
      await session
        .withErrors(validation.messages())
        .flashAll()

      return response.redirect('back')
    }

    if(await User.query().where('username', data.username).getCount() > 0 && auth.user.username != data.username){
      await session
        .withErrors([{ field: 'username', message: 'Ce pseudo est déjà utilisé.' }])
        .flashAll()
        return response.redirect('back')
    }else if(await User.query().where('email', data.email).getCount() > 0 && auth.user.email != data.email){
      await session
        .withErrors([{ field: 'email', message: 'Cette adresse email est déjà utilisé.' }])
        .flashAll()
        return response.redirect('back')
    }
   
    const infos = { 
      username: data.username,
      email: data.email
    }

    if(!data.password.isEmpty()) infos.password = data.password

    if(image){
      const img = `${auth.user.id}.${new Date().getTime()}.${image.subtype}`;
      await image.move(Helpers.publicPath('/uploads/users'), {name: img})
      data.profil =  `/uploads/users/${img}`
    }

    await User.query().where('id', auth.user.id).update(infos)

    session.flash({
      valid_basic: 'Informations modifiés'
    })
    /*await Mail.send('mails/profil_modif', data, (message) => {
      message
        .to('<email>')
        .from('no-reply@draftman.fr', 'draftman.fr')
        .subject('Modification du profil sur DraftMan.fr')
        .replyTo('contact@draftman.fr', 'DraftMan')
    })*/
    return response.redirect('back')
  }

  async storeInfos({session, request, response, auth}){
    const data = request.only(['website', 'twitter', 'github', 'linkedin'])

    await User.query().where('id', auth.user.id).update({ 
      website: data.website,
      twitter: data.twitter,
      github: data.github,
      linkedin: data.linkedin
    })

    session.flash({
      valid_infos: 'Informations modifiés'
    })
    
    /*await Mail.send('mails/profil_modif', data, (message) => {
      message
        .to('<email>')
        .from('no-reply@draftman.fr', 'draftman.fr')
        .subject('Modification du profil sur DraftMan.fr')
        .replyTo('contact@draftman.fr', 'DraftMan')
    })*/
    return response.redirect('back')
  }
}

module.exports = ProfilController
