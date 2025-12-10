import { IArchivedBlog, IBlog } from '@/types'
import request, { gql } from 'graphql-request'
import { cache } from 'react'

const graphqlAPI = process.env.NEXT_PUBLIC_GRAPHCMS_ENDPOINT!

export const getBlogs = async (locale = 'en') => {
	const query = gql`
		query MyQuery {
			blogs(where: { archive: false }, first: 204, locales: [${locale}]) {
				title
				createdAt
				author {
					name
					image {
						url
					}
				}
				category {
					name
					slug
				}
				description
				tag {
					name
					slug
				}
				image {
					url
				}
				content {
					html
				}
				slug
			}
		}
	`

	const { blogs } = await request<{ blogs: IBlog[] }>(graphqlAPI, query)
	return blogs ?? []
}
export const getDetailedBlog = cache(
	async (slug: string, locale: string = 'uz') => {
		const query = gql`
			query MyQuery($slug: String!, $locale: [Locale!]!) {
				blogs(where: { slug: $slug }, locales: $locale) {
					author {
						name
						image {
							url
						}
						bio
						id
					}
					content {
						html
					}
					description
					createdAt
					image {
						url
					}
					slug
					tag {
						name
						slug
					}
					category {
						name
						slug
					}
					title
				}
			}
		`

		const { blogs } = await request<{ blogs: IBlog[] }>(graphqlAPI, query, {
			slug,
			locale: [locale],
		})

		// Agar faqat bitta blog qaytishini kutayotgan bo‘lsangiz:
		return blogs?.[0] ?? null
	}
)

export const getSearchBlogs = async (title: string) => {
	const query = gql`
		query MyQuery($title: String!) {
			blogs(where: { title_contains: $title }) {
				title
				image {
					url
				}
				slug
				createdAt
			}
		}
	`
	const { blogs } = await request<{ blogs: IBlog[] }>(graphqlAPI, query, {
		title,
	})
	return blogs
}

export const getArchiveBlogs = async () => {
	const query = gql`
		query MyQuery {
			blogs(where: { archive: true }) {
				title
				createdAt
				slug
			}
		}
	`

	const { blogs } = await request<{ blogs: IBlog[] }>(graphqlAPI, query)
	const filteredBlogs = blogs.reduce(
		(acc: { [year: string]: IArchivedBlog }, blog: IBlog) => {
			const year = blog.createdAt.substring(0, 4)
			if (!acc[year]) {
				acc[year] = { year, blogs: [] }
			}
			acc[year].blogs.push(blog)
			return acc
		},
		{}
	)
	const results: IArchivedBlog[] = Object.values(filteredBlogs)
	return results
}
