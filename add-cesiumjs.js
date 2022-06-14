// This is how to add CesiumJS. 2 examples for typescript react and typescript js


// This goes into Iris Home file. Its origin is a typescript create react app.

import React, { useEffect } from 'react';

import {
  createDefaultImageryProviderViewModels,
  Ion,
  Viewer,
} from 'cesium';

import { makeStyles } from '@material-ui/core';

const styles = makeStyles({
  container: {
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
  },
});

let viewer: Viewer;
const containerId = 'cesiumContainer';

const CesiumMap: React.FunctionComponent = () => {
  

  useEffect(() => {
    void (async (): Promise<void> => {
      

     
      // Set custom token
      Ion.defaultAccessToken = 'your cesium ion token here';

      // Get the index of OpenStreetMap provider to select it first
      const viewModels = createDefaultImageryProviderViewModels();
      const openStreetMapModelIndex = viewModels.findIndex((model) =>
        model.iconUrl.includes('openStreetMap')
      );

      
  const classes = styles();

  return <div id={containerId} className={classes.container} />;
});

export default CesiumMap; // add <CesiumMap /> were you want the cesium globe to appear



// this goes into the root html file inside the <head> </head> area (valid for both react and js snippet)

// <!-- needed for cesium  -->
// <link href="/build/Widgets/widgets.css" rel="stylesheet" />
// <script async type='text/javascript'>window.CESIUM_BASE_URL = '/build/';</script>






// Typescript JS Version
// This goes into Iris Home file.

import {Viewer} from 'cesium'
  import * as Cesium from 'cesium';
	import {  } from 'cesium';
	import '../node_modules/cesium/Build/Cesium/Widgets/widgets.css'


  // avoid "window not declared"
	if (typeof window !== "undefined"){
		// browser code
	}
	
  // cesium viewer
  let viewer: Viewer;
  // cesium basic settings
  onMount(async () => { 
		viewer = new Viewer('cesiumContainer', {
    "animation": false,
    "baseLayerPicker": false,
    "fullscreenButton": false,
    "vrButton": false,
    "geocoder": false,
    "homeButton": false,
    "infoBox": false,
    "sceneModePicker": false,
    "selectionIndicator": false,
    "timeline": false,
    "navigationHelpButton": false,
    "shouldAnimate": true
    
    //Use OpenStreetMaps
    // imageryProvider : new Cesium.OpenStreetMapImageryProvider({
    //    url : 'https://a.tile.openstreetmap.org/'
    // })
    
		});
	});
	// cesium access token
	Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNTY0ZjMxYy1hZTdjLTRiMzQtYTc4Yi02NWQ5MzU4MWUxMjgiLCJpZCI6NDcwNzcsImlhdCI6MTYxNjg2MzYxOX0.V-4tUKhYM_XHdchqDu3MAAJPezusOzxMeimdYzCXd94';
