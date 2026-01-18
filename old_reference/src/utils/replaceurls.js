export const replaceURLs = text => {
  const urlPattern = /((https?:\/\/[^\s]+)|(www\.[^\s]+))/g;

  return text.replace(urlPattern, url => {
    let hyperlink = url;
    if (!hyperlink.match("^https?://")) {
      hyperlink = "http://" + hyperlink;
    }

    if (hyperlink.match(/\.(jpeg|jpg|gif|png)$/)) {
      return `<img src="${hyperlink}" alt="image" style="max-width:100%;" />`;
    }

    return `<a href="${hyperlink}" target="_blank" rel="noopener noreferrer">[Outside Link]</a>`;
  });
};
