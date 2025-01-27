// Basic vertex shader (used across all quality levels)
const vertexShader = `
    attribute vec4 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    
    void main() {
        gl_Position = aPosition;
        vTexCoord = aTexCoord;
    }
`;

// Low quality fragment shader - Basic motion detection
const fragmentShaderLow = `
    precision mediump float;
    uniform sampler2D uCurrentFrame;
    uniform sampler2D uPreviousFrame;
    varying vec2 vTexCoord;
    
    void main() {
        vec4 current = texture2D(uCurrentFrame, vTexCoord);
        vec4 previous = texture2D(uPreviousFrame, vTexCoord);
        
        float diff = length(current.rgb - previous.rgb);
        gl_FragColor = vec4(diff > 0.1 ? 1.0 : 0.0);
    }
`;

// Medium quality fragment shader - Motion detection with noise reduction
const fragmentShaderMedium = `
    precision mediump float;
    uniform sampler2D uCurrentFrame;
    uniform sampler2D uPreviousFrame;
    varying vec2 vTexCoord;
    
    void main() {
        vec2 texelSize = vec2(1.0) / vec2(textureSize(uCurrentFrame, 0));
        vec4 current = texture2D(uCurrentFrame, vTexCoord);
        vec4 previous = texture2D(uPreviousFrame, vTexCoord);
        
        // Sample neighboring pixels for noise reduction
        vec4 currentBlur = vec4(0.0);
        vec4 previousBlur = vec4(0.0);
        
        for(int x = -1; x <= 1; x++) {
            for(int y = -1; y <= 1; y++) {
                vec2 offset = vec2(float(x), float(y)) * texelSize;
                currentBlur += texture2D(uCurrentFrame, vTexCoord + offset);
                previousBlur += texture2D(uPreviousFrame, vTexCoord + offset);
            }
        }
        
        currentBlur /= 9.0;
        previousBlur /= 9.0;
        
        float diff = length(currentBlur.rgb - previousBlur.rgb);
        gl_FragColor = vec4(diff > 0.1 ? 1.0 : 0.0);
    }
`;

// High quality fragment shader - Advanced motion detection with temporal smoothing
const fragmentShaderHigh = `
    precision highp float;
    uniform sampler2D uCurrentFrame;
    uniform sampler2D uPreviousFrame;
    uniform sampler2D uMotionHistory;
    uniform float uTemporalWeight;
    varying vec2 vTexCoord;
    
    void main() {
        vec2 texelSize = vec2(1.0) / vec2(textureSize(uCurrentFrame, 0));
        vec4 current = texture2D(uCurrentFrame, vTexCoord);
        vec4 previous = texture2D(uPreviousFrame, vTexCoord);
        vec4 history = texture2D(uMotionHistory, vTexCoord);
        
        // Gaussian blur for noise reduction
        vec4 currentBlur = vec4(0.0);
        vec4 previousBlur = vec4(0.0);
        float weights[9] = float[](
            0.0625, 0.125, 0.0625,
            0.125,  0.25,  0.125,
            0.0625, 0.125, 0.0625
        );
        
        int idx = 0;
        for(int x = -1; x <= 1; x++) {
            for(int y = -1; y <= 1; y++) {
                vec2 offset = vec2(float(x), float(y)) * texelSize;
                currentBlur += texture2D(uCurrentFrame, vTexCoord + offset) * weights[idx];
                previousBlur += texture2D(uPreviousFrame, vTexCoord + offset) * weights[idx];
                idx++;
            }
        }
        
        float diff = length(currentBlur.rgb - previousBlur.rgb);
        float motion = smoothstep(0.05, 0.15, diff);
        
        // Temporal smoothing
        float smoothedMotion = mix(history.r, motion, uTemporalWeight);
        gl_FragColor = vec4(smoothedMotion);
    }
`;

export const shotDetectionShaders = [
    {
        vertex: vertexShader,
        fragment: fragmentShaderLow,
        complexity: 0.3 // 30% complexity
    },
    {
        vertex: vertexShader,
        fragment: fragmentShaderMedium,
        complexity: 0.6 // 60% complexity
    },
    {
        vertex: vertexShader,
        fragment: fragmentShaderHigh,
        complexity: 1.0 // 100% complexity
    }
]; 