## Audio Content

When including audio content, ensure proper accessibility:

```html
<figure>
    <audio controls>
        <source src="../../static/media/audio/podcast.mp3" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>
    <figcaption>
        <a href="../../static/media/audio/transcript.html">
            View transcript
        </a>
    </figcaption>
</figure>
```

Key requirements:
- Always include controls
- Provide fallback text
- Link to transcript
- Use semantic HTML elements (figure/figcaption) 