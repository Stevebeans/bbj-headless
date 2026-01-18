// lib/apolloClient.js
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL
});

const logLink = setContext((request, previousContext) => {
  return previousContext;
});

const createApolloClient = () => {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: logLink.concat(httpLink),
    cache: new InMemoryCache()
  });
};

export default createApolloClient;
