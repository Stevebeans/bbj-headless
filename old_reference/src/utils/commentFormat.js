const commentConversion = count => {
  const numberCount = parseInt(count);

  return numberCount > 1 ? `${numberCount} Comments` : `${numberCount} Comment`;
};

export { commentConversion };
