// Sound effects live in /audio/sound. Add a file there, import it here, and list it in
// SOUNDS; BootScene loads everything listed and scenes play it by key with this.sound.play.
import bounce1 from '../../audio/sound/bounce1.mp3'
import explosion1 from '../../audio/sound/explosion1.mp3'
import teleport1 from '../../audio/sound/teleport1.mp3'

export const SOUNDS = {
  bounce1,
  explosion1,
  teleport1,
}
