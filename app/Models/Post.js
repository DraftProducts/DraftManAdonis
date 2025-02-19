'use strict'

const Model = use('Model')

class Post extends Model {
    static get table () {
        return 'posts'
    }

    /**
     * Defines the relationship between a blog post
     * and his author.
     *
     * @see https://adonisjs.com/docs/4.0/relationships#_belongs_to
     */
    author () {
        return this.belongsTo('App/Models/User', 'author_id', 'id')
    }
}

module.exports = Post