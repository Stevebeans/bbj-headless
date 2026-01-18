"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { searchContent } from "@/utils/api";
import Spinner from "./Spinner";

// Debounce function to limit the rate of API calls
const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};

// Cache to store search results for quick retrieval
const cache = {};

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ posts: [], pages: [] });
  const [loading, setLoading] = useState(false);

  // Function to fetch search results from the API
  const fetchResults = async query => {
    if (cache[query]) {
      setResults(cache[query]);
      return;
    }
    setLoading(true);
    const searchResults = await searchContent(query);
    cache[query] = searchResults;
    setResults(searchResults);
    setLoading(false);
  };

  // Debounced version of the fetchResults function
  const debouncedFetchResults = useCallback(debounce(fetchResults, 300), []);

  // Effect to trigger the debounced fetch function when query changes
  useEffect(() => {
    if (query.trim()) {
      debouncedFetchResults(query);
    }
  }, [query, debouncedFetchResults]);

  return (
    <div className="hidden lg:block border-black p-2 grow  max-w-96">
      <div className="relative">
        <FaMagnifyingGlass className="absolute top-3 left-3 text-gray-400 dark:text-gray-300" />
        <input type="text" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} className="block  w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
      </div>
      {loading && <Spinner />}
      <div>
        {results.posts.length > 0 ? (
          <ul>
            {results.posts.map(post => (
              <li key={post.id}>
                <a href={post.link} target="_blank" rel="noopener noreferrer">
                  {post.title.rendered}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p></p>
        )}
      </div>
      <div>
        {results.pages.length > 0 ? (
          <ul>
            {results.pages.map(page => (
              <li key={page.id}>
                <a href={page.link} target="_blank" rel="noopener noreferrer">
                  {page.title.rendered}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p></p>
        )}
      </div>
    </div>
  );
};

export default Search;
