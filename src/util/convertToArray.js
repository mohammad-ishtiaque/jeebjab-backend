const convertToArray = (data) => {
  return typeof data === "string" ? JSON.parse(data) : data;
};

export default convertToArray;