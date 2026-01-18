import { htmlToText } from "html-to-text";

// function to return a plural or singular word based on the number of comments
const commentConversion = count => {
  const numberCount = parseInt(count);

  return numberCount > 1 ? `${numberCount} Comments` : `${numberCount} Comment`;
};

export { commentConversion };

const convertExcerpt = (content, wordLimit) => {
  // Remove shortcodes
  let cleanedContent = content.replace(/\[.*?\]/g, "");

  // Remove HTML comments
  cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, "");

  // Remove specific HTML tags (e.g., <figure> and its contents)
  cleanedContent = cleanedContent.replace(/<figure[\s\S]*?<\/figure>/gi, "");

  // Convert HTML to plain text
  const plainTextContent = htmlToText(cleanedContent, {
    wordwrap: false, // Disable word wrapping to avoid breaking words
    ignoreImage: true // Ignore images if any
  });

  const words = plainTextContent.split(" ");
  if (words.length <= wordLimit) {
    return plainTextContent;
  }
  const excerpt = words.slice(0, wordLimit).join(" ") + "...";
  return excerpt;
};
export { convertExcerpt };
