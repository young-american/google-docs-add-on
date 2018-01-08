/* globals Utilities */

const API_BASE = 'https://public-api.wordpress.com/rest/v1.1'
const CRLF = '\r\n'
const DEFAULT_FILENAME = 'image'
const ACCESS_TOKEN = '4g1#5WJp2w5fC#4!O!4Y1dyfCO3eC0qjUNvz$Ee4Jwl^NeTHkQA(xg(HhwCq@M(r';

const contentTypeToExtension = {
	'image/png': 'png',
	'image/jpeg': 'jpeg',
	'image/bmp': 'bmp',
	'image/gif': 'gif'
}

function filenameForBlob( blob ) {
	if ( blob.getName() ) {
		return blob.getName()
	}

	const contentType = blob.getContentType()
	if ( contentTypeToExtension[ contentType ] ) {
		return DEFAULT_FILENAME + '.' + contentTypeToExtension[ contentType ]
	}

	throw new Error( 'Unsupported content type: ' + contentType )
}

function makeMultipartBody( payload, boundary ) {
	var body = Utilities.newBlob( '' ).getBytes()

	for ( let k in payload ) {
		let v = payload[ k ]

		if ( v.toString() === 'Blob' ) {
			// attachment
			body = body.concat(
				Utilities.newBlob(
					'--' + boundary + CRLF
					+ 'Content-Disposition: form-data; name="' + k + '"; filename="' + encodeURIComponent( filenameForBlob( v ) ) + '"' + CRLF
					+ 'Content-Type: ' + v.getContentType() + CRLF
					// + 'Content-Transfer-Encoding: base64' + CRLF
					+ CRLF
				).getBytes() )

			body = body
				.concat( v.getBytes() )
				.concat( Utilities.newBlob( CRLF ).getBytes() )
		} else {
			// string
			body = body.concat(
				Utilities.newBlob(
					'--' + boundary + CRLF
					+ 'Content-Disposition: form-data; name="' + k + '"' + CRLF + CRLF
					+ v + CRLF
				).getBytes()
			)
		}
	}

	body = body.concat( Utilities.newBlob( CRLF + '--' + boundary + '--' + CRLF ).getBytes() )

	return body
}

export function WPClient( PropertiesService, UrlFetchApp ) {
	function request( access_token, path, options ) {
		const url = API_BASE + path;
		let headers = { Authorization: `Bearer ${ access_token }` }
		if ( options.headers ) {
			headers = Object.assign( headers, options.headers )
		}

		return JSON.parse( UrlFetchApp.fetch( url, Object.assign( options, { headers } ) ) )
	}

	function get( access_token, path, options = {} ) {
		return request( access_token, path, Object.assign( { method: 'get' }, options ) )
	}

	function post( access_token, path, options = {} ) {
		const payload = ( options.payload ) ? JSON.stringify( options.payload ) : null
		return request( access_token, path, Object.assign( { method: 'post' }, options, { payload } ) )
	}

	function postToWordPress( site, postIdParam, payload = {} ) {
		const postId = postIdParam || 'new'
		const { blog_id, access_token } = site
		const path = `/sites/${ blog_id }/posts/${ postId }`

		return post( access_token, path, { payload } )
	}

	function getPostStatus( site, postId ) {
		const { blog_id, access_token } = site;
		const path = `/sites/${ blog_id }/posts/${ postId }`

		return get( access_token, path )
	}

	const hasImageFileExtension = filename => {
		const extension = ( filename && filename.split( '.' ).pop() ) ;
		return ( extension && extension.match( /\.(png|gif|jpeg|jpg)$/i ) );
	}

	/**
	 * @param {Site} site { blog_id, access_token }
	 * @param {InlineImage} image a Google InlineImage
	 * @param {Number} parentId blog post id to attach to
	 * @return {object} response
	 */
	function uploadImage( site, image, parentId = 0 ) {
		const { blog_id, access_token } = site;
		const path = `/sites/${ blog_id }/media/new`
		const imageBlob = image.getBlob()

		if ( ! imageBlob.getName() && image.getAltDescription ) {
			// WP needs a valid file extension
			let extension = '';
			if ( ! hasImageFileExtension( image.getAltDescription() ) ) {
				const mimeType = imageBlob.getContentType();
				extension = ( contentTypeToExtension[ mimeType ] )
					? '.' + contentTypeToExtension[ mimeType ]
					: '';
			}
			imageBlob.setName( image.getAltDescription() + extension )
		}
		const boundary = '-----CUTHEREelH7faHNSXWNi72OTh08zH29D28Zhr3Rif3oupOaDrj'

		const options = {
			method: 'post',
			contentType: `multipart/form-data; boundary=${ boundary }`,
			payload: makeMultipartBody( { 'media[0]': imageBlob, 'attrs[0][parent_id]': parentId }, boundary )
		}

		return request( access_token, path, options )
	}

	function attachImageToPost(site, postId, imageJson) {
		const { blog_id, access_token } = site;
		imageJson.parent_id = postId;
		const options = {
			method: 'post',
			muteHttpExceptions: true,
			headers: {
				authorization: `Bearer ${ACCESS_TOKEN}`,
			},
			payload: imageJson
		};
		const response = UrlFetchApp.fetch(
			`https://public-api.wordpress.com/rest/v1.1/sites/${blog_id}/media/${imageJson.ID}/`,
			options
		);

		return JSON.parse(response)
	}

	function getPost(site, postId) {
		const { blog_id, access_token } = site;

		const options = {
			method: 'get',
			muteHttpExceptions: true,
			headers: {
				authorization: `Bearer ${ACCESS_TOKEN}`,
			}
		};
		const response = UrlFetchApp.fetch(
			`https://public-api.wordpress.com/rest/v1.1/sites/${blog_id}/posts/${postId}/`,
			options
		);
		return JSON.parse(response);
	}

	function prependFeaturedImageToPostContent(site, postId, imageData, photographerName, photographerUrl, photoDescription) {
		Logger.log('Prepending')
		// Logger.log(postId)
		const { blog_id, access_token } = site;
		const post = getPostStatus(site, postId);
		Logger.log(post.author.ID);
		Logger.log(post);
		const attachmentId = Object.keys(post.attachments)[0];
		const options = {
			method: 'post',
			muteHttpExceptions: true,
			headers: {
				authorization: `Bearer ${ACCESS_TOKEN}`,
			},
			payload: {
				 "author": post.author.ID,
				 "date": post.date,
				 "modified": post.modified,
			   "content":`[caption id=\"attachment_${attachmentId}\" align=\"alignnone\" width=\"${imageData.width}\"]<img class=\"wp-image-${attachmentId} size-full_bleed\" src=\"
				 ${imageData.URL}?w=${imageData.width}\" alt=\"${photoDescription}\" width=\"${imageData.width}\" height=\"${imageData.height}\" /> <a href=\"${photographerUrl}?utm_source=thought_catalog_wordpress_plugin&utm_medium=referral\">${photographerName}</a>[/caption]${post.content}`,
			}
		};
		const response = UrlFetchApp.fetch(
			`https://public-api.wordpress.com/rest/v1.1/sites/${blog_id}/posts/${postId}/`,
			options
		)
		Logger.log('Response from prepend')
		Logger.log(response);
		return JSON.parse(response)
	}

	function uploadWordpressMediaFromUrl(site, imageUrl) {
		const { blog_id, access_token } = site;
		const imageBlob = UrlFetchApp.fetch(
			imageUrl,
			{
				method: 'get'
			}
		).getBlob();

		if ( ! imageBlob.getName() && image.getAltDescription ) {
			// WP needs a valid file extension
			let extension = '';
			if ( ! hasImageFileExtension( image.getAltDescription() ) ) {
				const mimeType = imageBlob.getContentType();
				extension = ( contentTypeToExtension[ mimeType ] )
					? '.' + contentTypeToExtension[ mimeType ]
					: '';
			}
			imageBlob.setName( image.getAltDescription() + extension )
		}
		const boundary = '-----CUTHEREelH7faHNSXWNi72OTh08zH29D28Zhr3Rif3oupOaDrj'

		const options = {
			method: 'post',
			muteHttpExceptions: true,
			headers: {
				authorization: `Bearer ${ACCESS_TOKEN}`,
			},
			payload: { 'media[0]': imageBlob, 'attrs[0][parent_id]': 824420}
		};
		Logger.log(options)
		return JSON.parse(UrlFetchApp.fetch(
			`https://public-api.wordpress.com/rest/v1.1/sites/${blog_id}/media/new/`,
			options
		))
	}

	function getSiteInfo( site ) {
		const { blog_id, access_token } = site
		return get( access_token, `/sites/${ blog_id }` )
	}

	function getPostTypes( site ) {
		const { blog_id, access_token } = site
		const response = get( access_token, `/sites/${ blog_id }/post-types` )
		return response.post_types || []
	}

	function getCategories( site ) {
		const { blog_id, access_token } = site
		const response = get( access_token, `/sites/${ blog_id }/categories` )
		return response.categories || []
	}

	function getTaxonomiesForPostType( site, postType ) {
		const { blog_id, access_token } = site
		const { name } = postType
		/**
		* TODO: Remove this token.  Absolutely can not go to prod!
		*/
		const response = get( ACCESS_TOKEN, `/sites/${ blog_id }/post-types/${ name }/taxonomies` )
		return response.taxonomies || []
	}

	return {
		postToWordPress,
		getSiteInfo,
		uploadImage,
		uploadWordpressMediaFromUrl,
		getPostStatus,
		getPostTypes,
		getCategories,
		getTaxonomiesForPostType,
		attachImageToPost,
		prependFeaturedImageToPostContent,
	}
}
