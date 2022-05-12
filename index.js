const manageAnnotations = (tracks, sources) => {
  (() => {
    if (tracks.length !== sources.length)
      throw "tracks and sources lengths do not match.";
    const maximumNumberOfTracks = 5;
    if (tracks.length > maximumNumberOfTracks)
      throw `Content exceeds the maximum of ${maximumNumberOfTracks} tracks.`;
    const maximumNumberOfAnnotations = 500;
    for (const [i, annotations] of tracks.entries()) {
      if (annotations.length > maximumNumberOfAnnotations)
        throw `Track queued at index ${i} with ${
          annotations.length
        } annotations has ${
          annotations.length - maximumNumberOfAnnotations
        } more annotations than the ${maximumNumberOfAnnotations} annotation maximum.`;
    }
  })();

  const mediaElement = $("#media-element");
  let trackSourceIndex = 0,
    firstUpdate = true;
  mediaElement[0].setAttribute("src", sources[trackSourceIndex]);
  mediaElement[0].displayedAnnotations = {};

  /* Sorts the annotation objects by startTime and adds a displayID property to each annotation object. */
  (() => {
    for (const [i, track] of tracks.entries()) {
      tracks[i] = track.sort((a, b) => {
        return a.startTime - b.startTime;
      });
      for (let j = 0; j < tracks[i].length; j++) {
        tracks[i][j].displayID = j;
      }
    }
  })();

  /* Determines if annotations show or hide at the currentTime and updates the displayedAnnotations map as applicable. */
  const handleAnnotationManagement = (currentTrack, currentTime) => {
      /* Hides annotations as applicable. */
      if (!!Object.keys(mediaElement[0].displayedAnnotations).length) {
        for (const id in mediaElement[0].displayedAnnotations) {
          const annotation = mediaElement[0].displayedAnnotations[id];
          if (!canDisplay(annotation, currentTime)) {
            annotation.hide();
            delete mediaElement[0].displayedAnnotations[id];
          }
        }
      }
      /* Sets the approximate starting index for oppositely-directional for loops 
        equal to the fraction of the way through the track where the playhead is located,
        enabling the iterations to start at an index where displayable annotations could presumably be.
        The loops end when the next annotation objects in sequence cannot display at the currentTime.
        This approach avoids starting the iteration at the 0 index each time the timeupdate event fires.
      */
      /* NOTE: The annotation objects generated in the './src/initialize.js' file distribute equally by startTime 
        so the existing methodology is expected to always be a performant solution for the provided inputs.
        TODO: The startIndex could be calculated in a more informed way to optimally handle 
        track inputs comprising annotation objects with unequivocally-distributed startTime values.
        (e.g. The loop adding the displayID properties could construct a consolidated map
        dividing the displayID values into range segments by startTime.)
        The oppositely-directional for loops can remain functional to ensure all displayable annotations are reached.
      */
      const progress = currentTime / mediaElement[0].duration,
        startIndex = Math.floor(currentTrack.length * progress);
      /* Increment */
      for (
        let increment = startIndex;
        currentTrack[increment] &&
        canDisplay(currentTrack[increment + 1], currentTime);
        increment++
      ) {
        handleDisplay(currentTrack[increment], currentTime);
      }
      /* Decrement */
      for (
        let decrement = startIndex - 1;
        currentTrack[decrement] &&
        canDisplay(currentTrack[decrement - 1], currentTime);
        decrement--
      ) {
        handleDisplay(currentTrack[decrement], currentTime);
      }
    },
    canDisplay = (n, time) => {
      if (!n) return false;
      return n.startTime <= time && time < n.endTime;
    },
    handleDisplay = (annotation, currentTime) => {
      const { displayID } = annotation;
      if (!displayID) throw `Annotations must have a displayID property.`;
      /* Invokes the annotation object's show() method if the annotation is within range to be displayed and if the displayedAnnotations map does not have a property name equal to displayID.
        NOTE: Using an object data type here avoids an unnecessary array iteration to get the displayed state.
      */
      if (
        canDisplay(annotation, currentTime) &&
        !mediaElement[0].displayedAnnotations[displayID]
      ) {
        mediaElement[0].displayedAnnotations[displayID] = annotation;
        annotation.show();
      }
      return;
    };

  mediaElement.on("timeupdate", (event) => {
    if (firstUpdate) return (firstUpdate = false);
    handleAnnotationManagement(
      tracks[trackSourceIndex],
      event.currentTarget.currentTime
    );
  });

  mediaElement.on("ended", (event) => {
    const { currentTarget } = event;
    if (trackSourceIndex === tracks.length - 1)
      return (currentTarget.displayedAnnotations = {});
    currentTarget.setAttribute("autoplay", true);
    currentTarget.setAttribute("src", sources[++trackSourceIndex]);
  });
};
