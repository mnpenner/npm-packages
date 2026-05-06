import type { RouteComponent } from '../../src'

type BlogPostParams = {
    id: string
    title?: string
}

const BlogPost: RouteComponent<BlogPostParams> = ({ id, title }) => {
    return (
        <div>
            <div>Blog post: {id}</div>
            <div>Title: {title}</div>
        </div>
    )
}

export default BlogPost
