// This is how to add CesiumJS
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



// this goes into the root html file inside the <head> </head> area

<!-- needed for cesium  -->
<link href="/build/Widgets/widgets.css" rel="stylesheet" />
<script async type='text/javascript'>window.CESIUM_BASE_URL = '/build/';</script>