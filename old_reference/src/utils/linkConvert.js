export const convertLink = comment => {
  if (typeof window === "undefined") {
    // If window is undefined, it means this code is running on the server, so return the comment as is
    return comment;
  }

  // Create a DOMParser to parse the HTML string
  const parser = new DOMParser();
  const doc = parser.parseFromString(comment, "text/html");

  // Function to replace plain text URLs with styled links or images
  const replacePlainTextUrls = node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const updatedText = node.nodeValue.replace(urlRegex, url => {
        const imageRegex = /\.(jpeg|jpg|png|gif)$/i;
        if (imageRegex.test(url)) {
          return `<img src="${url}" alt="Image" style="max-width:100%; height:auto;">`;
        } else {
          return `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow" style="font-weight:bold; text-decoration:underline;">Outside Link</a> <span style="font-size:12px;">(only click if trusted source)</span>`;
        }
      });

      // Replace the text node with new HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = updatedText;
      while (tempDiv.firstChild) {
        node.parentNode.insertBefore(tempDiv.firstChild, node);
      }
      node.parentNode.removeChild(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Recursively process child nodes
      node.childNodes.forEach(replacePlainTextUrls);
    }
  };

  // Process all child nodes of the document's body
  doc.body.childNodes.forEach(replacePlainTextUrls);

  // Return the processed HTML as a string
  return doc.body.innerHTML;
};
