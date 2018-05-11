/* global React, window */
import { postToWordPress, uploadWordpressMediaFromUrl, attachImageToPost, prependFeaturedImageToPostContent } from './services';

const TIMEOUT_MS = 60000

const withTimeout = ( prom ) => {
	const timeoutPromise = new Promise( ( resolve, reject ) => {
		const fail = () => reject( { message: 'Saving has timed out.' } )
		window.setTimeout( fail, TIMEOUT_MS )
	} )

	return Promise.race( [prom, timeoutPromise] )
}

export default class PostButton extends React.Component {
	constructor( props ) {
		super( props );
		this.state = { disabled: false };
		this.savePost = this.savePost.bind( this )
		this.savePostWithoutImage = this.savePostWithoutImage.bind( this )
		this.savePostWithImage = this.savePostWithImage.bind( this )
	}

	savePostWithImage() {
		console.log('Save post with image');
		return uploadWordpressMediaFromUrl(this.props.site.blog_id, this.props.selectedImageUrl)
			.then((result) => {
				const mediaData = result.media[0];
				postToWordPress(this.props.site.blog_id, {
					categories: this.props.postCategories,
					tags: this.props.postTags,
					type: this.props.postType,
					// featured_image: result.media[0].ID
				})
					.then( ( post ) => {
						this.setState( { disabled: false } )
						this.props.onPostSave( post  )
						attachImageToPost(this.props.site.blog_id, post.ID, mediaData)
						.then((result) => {
							console.log('Image was attached', post.ID, mediaData, result)
							prependFeaturedImageToPostContent(
								this.props.site.blog_id,
								post.ID,
								mediaData,
								this.props.selectedPhotographerName,
								this.props.selectedPhotographerUrl,
								this.props.selectedPhotoDescription
							);
						});
					} )
					.catch( ( e ) => {
						this.props.errorHandler( e )
						this.setState( { disabled: false } )
					})
			})
			.catch((err) => {
				console.log('Error uploading new media to wordpress', err);
			})
	}

	savePostWithoutImage() {
		return postToWordPress(this.props.site.blog_id, {
			categories: this.props.postCategories,
			tags: this.props.postTags,
			type: this.props.postType,
		})
			.then( ( post ) => {
				this.setState( { disabled: false } )
				this.props.onPostSave( post  )
			} )
			.catch( ( e ) => {
				this.props.errorHandler( e )
				this.setState( { disabled: false } )
			})
	}

	savePost() {
		this.setState( { disabled: true } )
		const saveMethod = this.props.selectedImageUrl.length ? this.savePostWithImage : this.savePostWithoutImage;
		withTimeout(
			saveMethod()
		)
	}

	render() {
		const buttonLabel = ( this.props.site.post ) ? 'Update' : 'Save';
		const buttonText = ( this.state.disabled ) ? 'Saving...' : buttonLabel;

		return <button className="sites-list__save-draft" disabled={ this.state.disabled } onClick={ this.savePost }>{ buttonText }</button>
	}
}
