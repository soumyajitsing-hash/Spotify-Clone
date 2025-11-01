let currentSong = new Audio();
let songs;
let currfolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currfolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    songs = []

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            let decodedHref = decodeURIComponent(element.href);
            let filename = decodedHref.split(/[/\\]/).pop();
            songs.push(filename);
        }
    }

    // Display songs in the library
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li> 
                            <img class="invert" src="music-svgrepo-com.svg" width="40px" alt="">
                            <div class="info">
                                <div>${song.replaceAll("%20", " ")}</div>
                                <div>Soum</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img src="start.svg" alt="">
                            </div>
                        </li>`;
    }
    
    // Add click listeners to song items
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })
    })

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currfolder}/` + track
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"
}

async function displayAlbums() {
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainter"); // Note: Your HTML has "cardContainter" (typo)
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs/") && !e.href.endsWith("/songs/")) {
            let folder = e.href.split("/").slice(-2)[0];
            
            // Fetch the info.json
            try {
                let a = await fetch(`/songs/${folder}/info.json`);
                let response = await a.json();
                
                cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg class="play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img"
                            aria-label="Play button">
                            <circle cx="60" cy="60" r="50" />
                            <polygon points="50,42 50,78 86,60" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${response.title}</h2>
                    <p>${response.description}</p>
                </div>`;
            } catch (error) {
                console.log(`Could not load info for ${folder}`);
            }
        }
    }
}

async function main() {
    // Get references to controls
    let play = document.querySelector("#play");
    let previous = document.querySelector("#previous");
    let next = document.querySelector("#next");

    // Load initial songs
    await getSongs("songs/cs");
    if (songs.length > 0) {
        playMusic(songs[0], true);
    }

    // Display albums and wait for them to load
    await displayAlbums();

    // Add click listeners to cards (after they're created)
    Array.from(document.querySelectorAll(".card")).forEach(e => {
        e.addEventListener("click", async item => {
            let folder = item.currentTarget.dataset.folder;
            await getSongs(`songs/${folder}`);
            if (songs.length > 0) {
                playMusic(songs[0], true);
            }
        });
    });

    // Play/Pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "start.svg";
        }
    });

    // Time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar click
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Hamburger menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous button
    previous.addEventListener("click", () => {
        currentSong.pause();
        let currentTrack = currentSong.src.split("/").slice(-1)[0];
        let index = songs.indexOf(decodeURIComponent(currentTrack));
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next button
    next.addEventListener("click", () => {
        currentSong.pause();
        let currentTrack = currentSong.src.split("/").slice(-1)[0];
        let index = songs.indexOf(decodeURIComponent(currentTrack));
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Volume slider
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    // Mute button - FIXED
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume-max-svgrepo-com.svg")) {
            e.target.src = e.target.src.replace("volume-max-svgrepo-com.svg", "mute-svgrepo-com.svg");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute-svgrepo-com.svg", "volume-max-svgrepo-com.svg");
            currentSong.volume = 0.5;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();