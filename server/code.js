/**
 * This is for the gas-webpack-plugin to explicitly expose functions to GAS
 */

import {
	onOpen,
	onInstall,
	showSidebar,
	authCallback,
	postToWordPress,
	devTest,
	listSites,
	deleteSite,
	clearSiteData,
	refreshSite,
	include,
	getAuthUrl,
	findImagesFromUnsplash,
	uploadWordpressMediaFromUrl,
	attachImageToPost,
	prependFeaturedImageToPostContent,
} from './index'

global.onOpen = onOpen;
global.onInstall = onInstall;
global.showSidebar = showSidebar;
global.authCallback = authCallback;
global.postToWordPress = postToWordPress;
global.devTest = devTest;
global.listSites = listSites;
global.deleteSite = deleteSite;
global.refreshSite = refreshSite;
global.clearSiteData = clearSiteData;
global.include = include;
global.getAuthUrl = getAuthUrl;
global.findImagesFromUnsplash = findImagesFromUnsplash;
global.uploadWordpressMediaFromUrl = uploadWordpressMediaFromUrl;
global.attachImageToPost = attachImageToPost;
global.prependFeaturedImageToPostContent = prependFeaturedImageToPostContent;
