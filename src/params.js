const { URL } = require("url");

exports.fileParams = (paramsText) => {
  let fileKey, version;

  if (paramsText.startsWith("https://www.figma.com/file/")) {
    const url = new URL(paramsText);
    fileKey = url.pathname.split("/")[2];
    version = url.searchParams.get("version-id");
  } else {
    let params = paramsText.split(" ");
    fileKey = params[0];
    version = params[1];
  }

  if (version) {
    return { fileKey, version, geometry: "paths" };
  }

  return { fileKey, geometry: "paths" };
};
