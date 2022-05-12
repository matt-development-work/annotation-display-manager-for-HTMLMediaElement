/* Initializes the annotation display manager with randomly-generated annotation objects based on the provided source durations. */
(() => {
  const tracks = [],
    /* NOTE: Source files must be provided. */
    sources = [...Array(5).keys()].map((i) => `./src/tracks/video-${i}.mp4`);
  /* Pre-sets the src attributes on an HTMLMediaElement sequentially to obtain the source durations in the loadeddata events. */
  const queueTracks = new Promise((resolve) => {
      /* Instantiates a new HTMLMediaElement to prevent the visible HTMLMediaElement from quickly cycling through poster images. */
      const trackInitializerMediaElement = $(
        '<video><source type="video/mp4"/></video>'
      );
      /* Each source is set on a delay to allow all annotation objects to construct. */
      for (let i = 1; i <= sources.length; i++) {
        setTimeout(
          () =>
            trackInitializerMediaElement[0].setAttribute("src", sources[i - 1]),
          250 * i
        );
      }
      trackInitializerMediaElement.on("loadeddata", (event) => {
        tracks.push(trackAnnotationsConstructor(event.currentTarget.duration));
        if (tracks.length === sources.length) resolve();
      });
    }),
    /* Constructs a random number of random-duration annotation objects to span the source duration at an equal random interval. */
    trackAnnotationsConstructor = (duration) => {
      const maximumAnnotations = 200;
      const totalAnnotations = Math.floor(Math.random() * maximumAnnotations),
        shuffledAnnotationIndices = ((array) => {
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
          return array;
        })([...Array(totalAnnotations).keys()]);
      let interval = parseFloat((duration / totalAnnotations).toFixed(2));
      const constructedAnnotations = [];
      for (
        let i = 0, j = shuffledAnnotationIndices[i];
        i < totalAnnotations;
        i++, j = shuffledAnnotationIndices[i]
      ) {
        startTime =
          j * interval > duration
            ? parseFloat((duration - interval).toFixed(2))
            : parseFloat((j * interval).toFixed(2));
        endTime =
          startTime + interval > duration
            ? parseFloat(duration.toFixed(2))
            : ((min, max, digits = 2) => {
                return parseFloat(
                  (Math.random() * (min - max) + max).toFixed(digits)
                );
              })(startTime + interval, duration);
        constructedAnnotations.push({
          show: () => {
            return;
          },
          hide: () => {
            return;
          },
          startTime: startTime,
          endTime: endTime,
        });
      }
      return constructedAnnotations;
    };

  queueTracks.then(() => manageAnnotations(tracks, sources));
})();
