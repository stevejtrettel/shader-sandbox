/**
 * Keyboard Test
 *
 * Demonstrates keyboard input via the keyboard texture.
 *
 * Instructions:
 * - Press keys A, W, S, D to see them light up
 * - Press keys 1-5 to change background color
 * - Press C to toggle an animation
 *
 * The keyboard texture is bound to the named sampler "keys".
 */

// Key definitions (ASCII codes)
const int Key_A = 65;
const int Key_W = 87;
const int Key_S = 83;
const int Key_D = 68;
const int Key_C = 67;
const int Key_1 = 49;
const int Key_2 = 50;
const int Key_3 = 51;
const int Key_4 = 52;
const int Key_5 = 53;

/**
 * Read current key state from keyboard texture.
 * Returns 1.0 if key is currently down, 0.0 if up.
 */
float ReadKey(int key) {
    return textureLod(keys, vec2((float(key) + 0.5) / 256.0, 0.25), 0.0).x;
}

/**
 * Read toggle state from keyboard texture.
 * Returns 1.0 or 0.0, toggling each time the key is pressed.
 */
float ReadKeyToggle(int key) {
    return textureLod(keys, vec2((float(key) + 0.5) / 256.0, 0.75), 0.0).x;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Default background color
    vec3 col = vec3(0.1, 0.1, 0.15);

    // Change background based on number keys
    if (ReadKey(Key_1) > 0.0) col = vec3(0.8, 0.2, 0.2);
    if (ReadKey(Key_2) > 0.0) col = vec3(0.2, 0.8, 0.2);
    if (ReadKey(Key_3) > 0.0) col = vec3(0.2, 0.2, 0.8);
    if (ReadKey(Key_4) > 0.0) col = vec3(0.8, 0.8, 0.2);
    if (ReadKey(Key_5) > 0.0) col = vec3(0.8, 0.2, 0.8);

    // Draw WASD key indicators in the corners
    float keySize = 0.15;
    float padding = 0.1;

    // W - top center
    if (distance(uv, vec2(0.5, 1.0 - padding)) < keySize && ReadKey(Key_W) > 0.0) {
        col = vec3(1.0, 1.0, 0.0);
    }

    // A - left center
    if (distance(uv, vec2(padding, 0.5)) < keySize && ReadKey(Key_A) > 0.0) {
        col = vec3(1.0, 1.0, 0.0);
    }

    // S - bottom center
    if (distance(uv, vec2(0.5, padding)) < keySize && ReadKey(Key_S) > 0.0) {
        col = vec3(1.0, 1.0, 0.0);
    }

    // D - right center
    if (distance(uv, vec2(1.0 - padding, 0.5)) < keySize && ReadKey(Key_D) > 0.0) {
        col = vec3(1.0, 1.0, 0.0);
    }

    // C toggle - center circle that animates when toggle is on
    float toggleState = ReadKeyToggle(Key_C);
    if (distance(uv, vec2(0.5)) < 0.1) {
        if (toggleState > 0.5) {
            // Animated when toggled on
            float pulse = 0.5 + 0.5 * sin(iTime * 3.0);
            col = vec3(pulse, 1.0 - pulse, 0.5);
        } else {
            // Static gray when toggled off
            col = vec3(0.3);
        }
    }

    fragColor = vec4(col, 1.0);
}
