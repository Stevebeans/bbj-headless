// lib/queries.js
import { gql } from "@apollo/client";

export const GET_POSTS = gql`
  query GetPosts {
    posts(first: 10) {
      nodes {
        title
        id
        date
        commentCount
        content
        excerpt
        slug
        uri
        featuredImage {
          node {
            mediaItemUrl
            uri
          }
        }
        author {
          node {
            id
            name
            uri
            avatar {
              url
              size
              height
              foundAvatar
              extraAttr
              width
            }
          }
        }
      }
    }
  }
`;

export const ALL_POSTS = gql`
  query Paginated_Posts {
    posts(first: 10, after: "") {
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      nodes {
        title
        uri
        slug
        date
        commentCount
        excerpt
        featuredImage {
          node {
            mediaItemUrl
            uri
          }
        }
        author {
          node {
            name
            uri
            id
            avatar {
              url
              width
              height
            }
          }
        }
      }
    }
  }
`;

export const GET_PAGINATED_POSTS = gql`
  query GetPaginatedPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after) {
      edges {
        node {
          title
          id
          date
          commentCount
          content
          excerpt
          slug
          uri
          featuredImage {
            node {
              mediaItemUrl
              uri
            }
          }
          author {
            node {
              id
              name
              uri
              avatar {
                url
                size
                height
                foundAvatar
                extraAttr
                width
              }
            }
          }
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: String!) {
    postBy(slug: $slug) {
      title
      content
      slug
      date
      author {
        node {
          name
        }
      }
      featuredImage {
        node {
          mediaItemUrl
        }
      }
    }
  }
`;

export const GET_FEED_UPDATES = gql`
  query GetFeedUpdates {
    feedUpdates(first: 20) {
      nodes {
        commentCount
        title
        uri
        slug
        status
        featuredImageId
        featuredImage {
          node {
            sourceUrl
            sizes
          }
        }
        content
      }
    }
  }
`;
