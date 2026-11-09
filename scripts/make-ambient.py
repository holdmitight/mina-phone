"""Generate four original, non-vocal ambient sketches for the fictional phone."""
import math
import wave
import array
import subprocess
from pathlib import Path

out = Path(__file__).resolve().parents[1] / 'public' / 'mina-media' / 'audio'
out.mkdir(parents=True, exist_ok=True)
sample_rate, duration = 22050, 24
melodies = [
    [261.63, 329.63, 392, 493.88, 392, 329.63, 293.66, 392],
    [220, 261.63, 329.63, 392, 329.63, 293.66, 261.63, 196],
    [293.66, 369.99, 440, 554.37, 440, 369.99, 329.63, 246.94],
    [246.94, 293.66, 369.99, 440, 369.99, 293.66, 277.18, 329.63],
]
for track, notes in enumerate(melodies, 1):
    pcm = array.array('h')
    for index in range(sample_rate * duration):
        t = index / sample_rate
        beat = int(t / 1.5)
        local = t % 1.5
        freq = notes[beat % len(notes)]
        env = (1 - math.exp(-local * 22)) * math.exp(-local * 2.0)
        tone = math.sin(2 * math.pi * freq * t) + .21 * math.sin(2 * math.pi * freq * 2 * t)
        bass = .22 * math.sin(2 * math.pi * notes[0] / 4 * t)
        fade = min(t / 1.5, 1, (duration - t) / 2)
        pcm.append(int((tone * env + bass) * fade * 2400))
    temporary = Path('/tmp') / f'mina-ambient-{track}.wav'
    with wave.open(str(temporary), 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        audio.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(temporary), '-c:a', 'libvorbis', '-q:a', '2', str(out / f'ambient{track}.ogg')], check=True)
    temporary.unlink()
    print(f'ambient{track}.ogg: {(out / f"ambient{track}.ogg").stat().st_size} bytes')
