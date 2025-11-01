export class AudioPlayer {
    constructor() {
        this.playlist = [
            {
                title: "Hydra",
                artist: "Hozho",
                url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Hozho/The_Last_Samurai/Hozho_-_Hydra.mp3",
                artwork: "https://img.freemusicarchive.org/images/albums/Hozho_-_The_Last_Samurai_-_20170914113958788.jpg?method=crop&width=290&height=290"
            },
            {
                title: "The Last Samurai",
                artist: "Hozho",
                url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Hozho/The_Last_Samurai/Hozho_-_The_Last_Samurai.mp3",
                artwork: "https://img.freemusicarchive.org/images/albums/Hozho_-_The_Last_Samurai_-_20170914113958788.jpg?method=crop&width=290&height=290"
            },
        ];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isInitialized = false; // Prevent auto-play issues
        this.audioElement = new Audio();
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.defaultArtwork = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM0MDQwNDAiPjxwYXRoIGQ9Ik0xMiAyQzYuNDg2IDIgMiA2LjQ4NiAyIDEyczQuNDg2IDEwIDEwIDEwIDEwLTQuNDg2IDEwLTEwUzE3LjUxNCAyIDEyIDJ6bTAgMThjLTQuNDE0IDAtOC0zLjU4Ni04LThzMy41ODYtOCA4LTggOCAzLjU4NiA4IDh6bS0xLTExaDJ2NmgtMnpNMTIgMTRoMnYyaC0yeiIvPjwvc3ZnPg=='; // Simple placeholder SVG
    }

    initializeAudio() {
        if (this.isInitialized) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.source = this.audioContext.createMediaElementSource(this.audioElement);

        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.isInitialized = true;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'audio-player-app';
        container.innerHTML = `
            <div class="player-body">
                <div class="artwork-container">
                    <img src="${this.defaultArtwork}" alt="Artwork" class="artwork-img">
                    <canvas class="visualizer"></canvas>
                </div>
                <div class="track-info">
                    <p class="title">No music loaded</p>
                    <p class="artist">Click button to add music</p>
                </div>
                <div class="progress-container">
                    <div class="progress-bar"></div>
                </div>
                <div class="player-controls">
                    <button data-action="add-music" title="Add music">+</button>
                    <button data-action="prev" title="Previous">⏮</button>
                    <button data-action="play-pause" title="Play/Pause">▶</button>
                    <button data-action="next" title="Next">⏭</button>
                </div>
                <input type="file" accept="audio/*" multiple style="display: none;" />
            </div>
        `;

        this.visualizerCanvas = container.querySelector('.visualizer');
        this.setupEventListeners(container);

        if (this.playlist.length > 0) {
            this.currentTrackIndex = 0;
            this.loadTrack(this.currentTrackIndex);
        }
        
        return container;
    }

    setupEventListeners(container) {
        const playPauseButton = container.querySelector('[data-action="play-pause"]');
        const prevButton = container.querySelector('[data-action="prev"]');
        const nextButton = container.querySelector('[data-action="next"]');
        const addButton = container.querySelector('[data-action="add-music"]');
        const fileInput = container.querySelector('input[type="file"]');

        playPauseButton.addEventListener('click', () => this.togglePlayPause());
        prevButton.addEventListener('click', () => this.prevTrack());
        nextButton.addEventListener('click', () => this.nextTrack());
        addButton.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (event) => this.handleFileSelect(event));
        
        this.audioElement.addEventListener('ended', () => this.nextTrack());
        this.audioElement.addEventListener('timeupdate', () => this.updateProgressBar());
    }

    togglePlayPause() {
        if (!this.audioElement.src) {
            if (this.playlist.length > 0) {
                this.loadTrack(this.currentTrackIndex);
            }
            return;
        }
        
        if (!this.isInitialized) {
            this.initializeAudio();
        }

        if (this.isPlaying) {
            this.audioElement.pause();
        } else {
            this.audioContext.resume();
            this.audioElement.play();
        }
        this.isPlaying = !this.isPlaying;
        this.updatePlayPauseButton();
    }

    prevTrack() {
        if (this.playlist.length > 0) {
            this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadTrack(this.currentTrackIndex);
        }
    }

    nextTrack() {
        if (this.playlist.length > 0) {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
            this.loadTrack(this.currentTrackIndex);
        }
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        const newTracks = files.map(file => ({
            title: file.name.replace('.mp3', ''),
            artist: 'Local File',
            url: URL.createObjectURL(file),
            artwork: 'https://via.placeholder.com/300',
            isLocal: true,
        }));

        this.playlist.push(...newTracks);

        if (files.length > 0 && !this.isPlaying) {
            this.currentTrackIndex = this.playlist.length - newTracks.length;
            this.loadTrack(this.currentTrackIndex);
        }
    }

    loadTrack(index) {
        const file = this.playlist[index];
        const fileURL = URL.createObjectURL(file);
        this.audioElement.src = fileURL;
        
        this.audioElement.play().then(() => {
            this.isPlaying = true;
            this.updatePlayPauseButton();
        }).catch(e => console.error("Playback failed:", e));

        const container = document.querySelector('.audio-player-app');
        const titleEl = container.querySelector('.track-info .title');
        const artistEl = container.querySelector('.track-info .artist');
        const artworkEl = container.querySelector('.artwork-img');

        // Reset to defaults
        titleEl.textContent = file.name;
        artistEl.textContent = 'Unknown Artist';
        artworkEl.src = this.defaultArtwork;

        // Read metadata using jsmediatags
        window.jsmediatags.read(file, {
            onSuccess: (tag) => {
                console.log(tag);
                const { title, artist, picture } = tag.tags;
                if (title) {
                    titleEl.textContent = title;
                }
                if (artist) {
                    artistEl.textContent = artist;
                }
                if (picture) {
                    const base64String = btoa(String.fromCharCode.apply(null, picture.data));
                    artworkEl.src = `data:${picture.format};base64,${base64String}`;
                }
            },
            onError: (error) => {
                console.error('Error reading metadata:', error);
            }
        });
        
        this.audioElement.ontimeupdate = () => this.updateProgressBar();
    }
    
    updateTrackInfo() {
        const container = document.querySelector('.audio-player-app');
        if (container) {
            const track = this.playlist[this.currentTrackIndex];
            container.querySelector('.track-info .title').textContent = track.title;
            container.querySelector('.track-info .artist').textContent = track.artist;
            container.querySelector('.artwork-img').src = track.artwork;
        }
    }

    updatePlayPauseButton() {
        const container = document.querySelector('.audio-player-app');
        if (container) {
            const playIcon = container.querySelector('.play-icon');
            const pauseIcon = container.querySelector('.pause-icon');
            if (this.isPlaying) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'inline-block';
            } else {
                playIcon.style.display = 'inline-block';
                pauseIcon.style.display = 'none';
            }
        }
    }

    updateProgressBar() {
        const container = document.querySelector('.audio-player-app');
        if (container) {
            const progressBar = container.querySelector('.progress-bar');
            const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
            progressBar.style.width = `${progress || 0}%`;
        }
    }

    drawVisualizer(canvas) {
        const canvasCtx = canvas.getContext('2d');
        this.analyser.fftSize = 256;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            this.animationFrameId = requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(dataArray);

            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength);
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                const red = 20 + (barHeight / 255) * 200;
                const green = 50 + (barHeight / 255) * 150;
                const blue = 75 + (barHeight / 255) * 50;

                canvasCtx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.8)`;
                canvasCtx.fillRect(x, canvas.height - (barHeight / 2), barWidth, barHeight / 2);

                x += barWidth + 1;
            }
        };

        draw();
    }
    
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.audioElement.pause();
        this.audioElement.src = "";
    }
}
