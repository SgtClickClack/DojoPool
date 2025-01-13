# Accessibility Guidelines

## Audio Content

When including audio content, follow these guidelines:

```html
<figure>
    <audio controls>
        <source src="../../src/dojopool/static/media/audio/podcast.mp3" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>
    <figcaption>
        <a href="../../src/dojopool/static/media/audio/transcript.html">View transcript</a>
    </figcaption>
</figure>
```