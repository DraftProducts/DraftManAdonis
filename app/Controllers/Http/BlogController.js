'use strict'

const Blog = use('App/Models/Blog')

class BlogController {
    async index({ view }){

        const blog = await Blog.all();

        return view.render('blog.index', {
            blog: blog.toJSON()
        })
    }

    async list({ view }){

        const blog = await Blog.all();

        return view.render('blog.list', {
            blog: blog.toJSON()
        })
    }

    async article({params, view}){

        const post = await Blog.find(params.id)
        const blog = await Blog.all();

        return view.render('blog.details', {
            item: post,
            blog: blog
        })
    }
}

module.exports = BlogController
