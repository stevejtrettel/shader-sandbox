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
 * All KEY_* constants and helper functions (keyDown, keyToggle,
 * isKeyDown, isKeyToggled) are auto-injected by the engine.
 */

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Default background color
    vec3 col = vec3(0.1, 0.1, 0.15);

    // Change background based on number keys
    if (isKeyDown(KEY_1)) col = vec3(0.8, 0.2, 0.2);
    if (isKeyDown(KEY_2)) col = vec3(0.2, 0.8, 0.2);
    if (isKeyDown(KEY_3)) col = vec3(0.2, 0.2, 0.8);
    if (isKeyDown(KEY_4)) col = vec3(0.8, 0.8, 0.2);
    if (isKeyDown(KEY_5)) col = vec3(0.8, 0.2, 0.8);

    // Draw WASD key indicators in the corners
    float keySize = 0.15;
    float padding = 0.1;

    // W - top center
    if (distance(uv, vec2(0.5, 1.0 - padding)) < keySize && isKeyDown(KEY_W)) {
        col = vec3(1.0, 1.0, 0.0);
    }

    // A - left center
    if (distance(uv, vec2(padding, 0.5)) < keySize && isKeyDown(KEY_A)) {
        col = vec3(1.0, 1.0, 0.0);
    }

    // S - bottom center
    if (distance(uv, vec2(0.5, padding)) < keySize && isKeyDown(KEY_S)) {
        col = vec3(1.0, 1.0, 0.0);
    }

    // D - right center
    if (distance(uv, vec2(1.0 - padding, 0.5)) < keySize && isKeyDown(KEY_D)) {
        col = vec3(1.0, 1.0, 0.0);
    }

    // C toggle - center circle that animates when toggle is on
    if (distance(uv, vec2(0.5)) < 0.1) {
        if (isKeyToggled(KEY_C)) {
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
