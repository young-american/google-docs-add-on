/* global React */
import { loadSites, getAuthUrl, deleteSite, refreshSite, findImagesFromUnsplash } from './services';
import Site from './site.jsx';
import ErrorMessage from './error-message.jsx'

export default class App extends React.Component {
	constructor( props ) {
		super( props )
		this.state = {
			sitesLoaded: false,
			sites: [],
			images: [],
			loadedImagePages: [],
			currentImagePage: 1,
			imagesLoading: false,
			selectedImageUrl: '',
			selectedPhotographerUrl: '',
			selectedPhotographerName: '',
			selectedPhotoDescription: '',
			error: null,
			authorizationUrl: null,
			imgPreview: ''
		};
		this.updateAuthUrl = this.updateAuthUrl.bind( this )
		this.updateSiteList = this.updateSiteList.bind( this )
		this.errorHandler = this.errorHandler.bind( this )
		this.clearError = this.clearError.bind( this )
		this.findImagesFromUnsplash = this.findImagesFromUnsplash.bind( this )
		this.searchUnsplash = this.searchUnsplash.bind( this );
		this.resetImageSearch = this.resetImageSearch.bind( this );
		this.loadNextImagePage = this.loadNextImagePage.bind( this );
	}

	componentDidMount() {
		this.updateSiteList()
		this.updateAuthUrl()
		this.authTimer = setInterval( () => this.updateAuthUrl(), 1000 * 60 * 3 )
	}

	componentWillUnmount() {
		clearInterval( this.authTimer )
	}

	searchUnsplash() {
		if (this.refs.imageSearchInput.value.length < 3) {
			return;
		}
		this.setState({ loadedImagePages: [1] });
		this.findImagesFromUnsplash(this.refs.imageSearchInput.value, 1);
	}

	loadNextImagePage() {
		this.state.currentImagePage = this.state.currentImagePage + 1;
		this.state.loadedImagePages.push(this.state.currentImagePage);
		this.findImagesFromUnsplash(this.refs.imageSearchInput.value, this.state.currentImagePage)
		this.setState({
			currentImagePage: this.state.currentImagePage,
			loadedImagePages: this.state.loadedImagePages
		})
	}

	resetImageSearch() {
		this.setState({ imagesLoading: false, selectedImageUrl: '', selectedPhotographerUrl: '', selectedPhotographerName: '', selectedPhotoDescription: '' })
	}

	findImagesFromUnsplash(searchTerm, page = 1) {
		this.setState({
			imagesLoading: true,
			selectedImageUrl: '',
			selectedPhotographerUrl: '',
			selectedPhotographerName: '',
			selectedPhotoDescription: '',
		});
		findImagesFromUnsplash(searchTerm, page)
			.then((images) => {
				const imageResults = images.results.map((image) => {
					return {
						url: image.urls.regular,
						title: image.description,
						photographerName: image.user.name,
						photographerUrl: image.user.links.html,
						description: image.description
					}
				})
				if (page === 1) {
					// otherwise replace all images with the first page of new results
					this.state.images = imageResults;
				} else {
					// if we haven't yet loaded this page of images, add the results into the gallery
					this.state.images = this.state.images.concat(imageResults);
				}
				this.setState({ images: this.state.images, imageCount: images.total, imagesLoading: false })
			})
			.catch((err) => this.setState({ error: err }))
	}

	updateSiteList() {
		loadSites()
			.then( ( sites ) => this.setState( { sites, sitesLoaded: true } ) )
			.catch( ( e ) => this.setState( { error: e } ) )
	}

	updateAuthUrl() {
		getAuthUrl()
			.then( ( authorizationUrl ) => this.setState( { authorizationUrl } ) )
			.catch( ( e ) => this.setState( { error: e } ) )
	}

	errorHandler( e ) {
		this.setState( { error: e } )
	}

	clearError() {
		this.setState( { error: null } )
	}

	removeSite( blog_id ) {
		return deleteSite( blog_id )
			.then( this.updateSiteList )
			.catch( this.errorHandler )
	}

	setPost( blog_id, post ) {
		const sites = this.state.sites.map( site => {
			if ( site.blog_id !== blog_id ) {
				return site
			}

			return Object.assign( {}, site, { post } )
		} )
		this.setState( { sites } )
	}

	/**
	 * @param {number} blog_id unique id for the site
	 * @returns {Promise} for new site information
	 */
	updateSite( blog_id ) {
		return refreshSite( blog_id )
			.then( updatedSite => {
				const sites = this.state.sites.map( site => ( site.blog_id === updatedSite.blog_id ) ? updatedSite : site )
				this.setState( { sites } )
				return updatedSite
			} )
			.catch( this.errorHandler )
	}

	render() {
		const hasSites = this.state.sitesLoaded && ( this.state.sites.length > 0 )
		const headerCopy = hasSites
			? 'Pick a site to copy this document to below. It will be saved on your site as a draft.'
			: 'Welcome! To get started, add your first WordPress.com or Jetpack-connected site by clicking the button at the bottom.'
		const loadingMessage = ( ! this.state.sitesLoaded ) ? <p className="loading">Loading…</p> : null

		return <div className="container">
			<div className="header">
				<h1><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M21 11v8c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V5c0-1.105.895-2 2-2h8l-2 2H5v14h14v-6l2-2zM7 17h3l7.5-7.5-3-3L7 14v3zm9.94-12.94L15.5 5.5l3 3 1.44-1.44c.585-.585.585-1.535 0-2.12l-.88-.88c-.585-.585-1.535-.585-2.12 0z"/></g></svg> Draft to WordPress</h1>

				<div className="header__help-text">
					<p>{ headerCopy }</p>
				</div>
			</div>

			<div className="sites-list" id="sites-list">
				{ loadingMessage }
				<ul>
					{ this.state.sites.map( site =>
						<Site
							key={ site.blog_id }
							site={ site }
							errorHandler={ this.errorHandler }
							setPost={ this.setPost.bind( this, site.blog_id ) }
							removeSite={ this.removeSite.bind( this, site.blog_id ) }
							refreshSite={ this.updateSite.bind( this, site.blog_id ) }
							selectedImageUrl={ this.state.selectedImageUrl }
							selectedPhotographerUrl={ this.state.selectedPhotographerUrl }
							selectedPhotographerName={ this.state.selectedPhotographerName }
							selectedPhotoDescription={ this.state.selectedPhotoDescription }
							updateSiteList={ this.updateSiteList } /> ) }
					<li className="sites-list__add-site"><a className="button button-secondary" href={ this.state.authorizationUrl } target="_blank">Add WordPress Site</a></li>
				</ul>
			</div>
			<div className="images-search-wrapper">
				<input type="text" ref="imageSearchInput" placeholder="Search Unsplash for photos" className="images-search-input" onChange={this.resetImageSearch}/>
				<div className="image-search-button" onClick={this.searchUnsplash}>Search</div>
				<div style={{width:'100%', float: 'left'}}>
					{this.state.selectedImageUrl.length ?
						<div style={{fontWeight: 'bold', float: 'left'}}>Nice pick!</div> :
						<div style={{fontWeight: 'bold', float: 'left'}}>Select a featured image</div>
					}
					{this.state.images.length ?
						<div style={{float: 'right'}}>{this.state.imageCount} results</div> :
						null
					}
				</div>
			</div>
			<div className="images-list">
				{this.state.imgPreview.length > 0 &&
					<div style={{ position: 'fixed', zIndex: 1, top:0, left:0 }}>
						<img src={this.state.imgPreview} width="100%" />
						<div
							style={{position: 'absolute', top: 10, right: 10, textDecoration: 'underline', cursor:'pointer', color:'#ddd'}}
							onClick={() => { this.setState({ imgPreview: '' }); }}
						>
							Minimize
						</div>
					</div>
				}
				{this.state.imagesLoading &&
					<div style={{textAlign: 'center', fontWeight: 'bold', color: '#bbb', fontSize: 16, padding: 15}}>Searching images...</div>
				}
				{!this.state.imagesLoading && this.state.images.map(image =>
					<div style={{position: 'relative', display:'inline-block', width:82}}>
						<div
							style={{color:'#fff', position: 'absolute', top: 2, left: 2, fontSize: 10, cursor: 'pointer', textDecoration: 'underline'}}
							onClick={() => { this.setState({ imgPreview: image.url }) }}
						>
							Zoom
						</div>
						<img
							src={image.url}
							style={{
								marginRight:5,
								width: 82,
								marginBottom: 5,
								verticalAlign: 'top',
								cursor: 'pointer',
								border: this.state.selectedImageUrl === image.url ? '2px solid #000' : 'none',
								opacity: this.state.selectedImageUrl.length && this.state.selectedImageUrl !== image.url ? .3 : 1
							}}
							onClick={() => {
								this.setState({
									selectedImageUrl: this.state.selectedImageUrl === image.url ? '' : image.url,
									selectedPhotographerName: image.photographerName,
									selectedPhotographerUrl: image.photographerUrl,
									selectedPhotoDescription: image.description
								})
							}} />
						</div>
				)}
				{this.state.images.length > 0 &&
					<div className="images-load-more-button" onClick={this.loadNextImagePage}>Load more!</div>
				}
			</div>

			<ErrorMessage msg={ this.state.error } clearError={ this.clearError } />

			<div className="footer">
				<div className="footer__help-link">
					<a title="Help" href="https://apps.wordpress.com/google-docs/support/"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 4c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8m0-2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4 8c0-2.21-1.79-4-4-4s-4 1.79-4 4h2c0-1.103.897-2 2-2s2 .897 2 2-.897 2-2 2c-.552 0-1 .448-1 1v2h2v-1.14c1.722-.447 3-1.998 3-3.86zm-3 6h-2v2h2v-2z"/></g></svg></a>
				</div>
			</div>
		</div>
	}
}
