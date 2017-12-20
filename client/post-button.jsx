/* global React, window */
import { postToWordPress, uploadWordpressMediaFromUrl } from './services';

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
	}

	savePost() {
		this.setState( { disabled: true } )
		withTimeout(

			uploadWordpressMediaFromUrl(this.props.site.blog_id, this.props.selectedImageUrl)
				.then((result) => {
					console.log('Uploaded new media to wordpress', result);
					postToWordPress(this.props.site.blog_id, {
						categories: this.props.postCategories,
						tags: this.props.postTags,
						type: this.props.postType,
						featured_image: result.media[0].ID
					})
						.then( ( post ) => {
							console.log('POST CREATED', post)
							this.setState( { disabled: false } )
							this.props.onPostSave( post  )
						} )
						.catch( ( e ) => {
							this.props.errorHandler( e )
							this.setState( { disabled: false } )
						})
				})
				.catch((err) => {
					console.log('Error uploading new media to wordpress', err);
				})


		)
	}

	render() {
		const buttonLabel = ( this.props.site.post ) ? 'Update' : 'Save';
		const buttonText = ( this.state.disabled ) ? 'Saving...' : buttonLabel;

		return <button className="sites-list__save-draft" disabled={ this.state.disabled } onClick={ this.savePost }>{ buttonText }</button>
	}
}
