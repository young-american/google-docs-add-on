const UNSPLASH_CLIENT_ID = '8d019969326e15e845cefc7e07b6381c7cf9a6e2986def2481dae1da6bbdb820';

export function UnsplashClient() {

  function request( url, options = { method: 'get' } ) {
    return JSON.parse(UrlFetchApp.fetch( url, options ))
  }

  function findImages(query) {
    const url = `https://api.unsplash.com/search/photos/?query=${query}&client_id=${UNSPLASH_CLIENT_ID}`;
    return request(url, {});
  }

  return {
    findImages,
  }
}
