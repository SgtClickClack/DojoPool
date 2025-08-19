use wasm_bindgen::prelude::*;
use web_sys::{ImageData, CanvasRenderingContext2d};
use std::cell::RefCell;

thread_local! {
    static FRAME_BUFFER_POOL: RefCell<Vec<Vec<u8>>> = RefCell::new(Vec::new());
}

const MAX_POOLED_BUFFERS: usize = 3;
const MIN_BUFFER_SIZE: usize = 1024 * 1024; // 1MB

#[wasm_bindgen]
pub struct FrameProcessor {
    width: u32,
    height: u32,
    threshold: f64,
    previous_frame: Option<Vec<u8>>,
    motion_threshold: f64,
    frame_size: usize,
}

#[wasm_bindgen]
impl FrameProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> FrameProcessor {
        let frame_size = (width * height * 4) as usize;
        
        // Pre-allocate buffers
        FRAME_BUFFER_POOL.with(|pool| {
            let mut pool = pool.borrow_mut();
            while pool.len() < MAX_POOLED_BUFFERS {
                pool.push(vec![0; frame_size]);
            }
        });

        FrameProcessor {
            width,
            height,
            threshold: 0.15,
            previous_frame: None,
            motion_threshold: 0.1,
            frame_size,
        }
    }

    fn get_buffer_from_pool(&self) -> Vec<u8> {
        FRAME_BUFFER_POOL.with(|pool| {
            let mut pool = pool.borrow_mut();
            pool.pop().unwrap_or_else(|| vec![0; self.frame_size])
        })
    }

    fn return_buffer_to_pool(&self, mut buffer: Vec<u8>) {
        if buffer.capacity() >= MIN_BUFFER_SIZE {
            buffer.clear();
            FRAME_BUFFER_POOL.with(|pool| {
                let mut pool = pool.borrow_mut();
                if pool.len() < MAX_POOLED_BUFFERS {
                    pool.push(buffer);
                }
            });
        }
    }

    #[wasm_bindgen]
    pub fn process_frame(&mut self, frame_data: &[u8]) -> Option<JsValue> {
        // Get a buffer from the pool instead of creating a new one
        let mut current_frame = self.get_buffer_from_pool();
        current_frame[..frame_data.len()].copy_from_slice(frame_data);

        let mut shot_detected = false;
        let mut shot_position = (0.0, 0.0);
        let mut confidence = 0.0;

        // Motion detection
        if let Some(ref prev_frame) = self.previous_frame {
            let (motion_detected, motion_center, motion_magnitude) = 
                self.detect_motion(&current_frame, prev_frame);

            if motion_detected {
                // Brightness analysis in motion area
                let (bright_spot, brightness) = 
                    self.analyze_brightness(&current_frame, motion_center);

                if brightness > self.threshold {
                    shot_detected = true;
                    shot_position = bright_spot;
                    confidence = (brightness + motion_magnitude) / 2.0;
                }
            }
        }

        // Update previous frame using buffer pooling
        if let Some(old_frame) = self.previous_frame.take() {
            self.return_buffer_to_pool(old_frame);
        }
        self.previous_frame = Some(current_frame);

        if shot_detected {
            let result = JsValue::from_serde(&ShotResult {
                detected: true,
                position: Position {
                    x: shot_position.0,
                    y: shot_position.1,
                },
                confidence,
            }).unwrap();
            Some(result)
        } else {
            None
        }
    }

    fn detect_motion(&self, current: &[u8], previous: &[u8]) -> (bool, (f64, f64), f64) {
        let mut diff_sum = 0.0;
        let mut motion_x = 0.0;
        let mut motion_y = 0.0;
        let mut pixel_count = 0.0;

        // Process pixels in chunks for better cache utilization
        for chunk in 0..(self.width * self.height) as usize / 64 {
            let start = chunk * 64 * 4;
            let end = start + 64 * 4;
            
            for idx in (start..end).step_by(4) {
                // Calculate pixel difference
                let diff_r = (current[idx] as f64 - previous[idx] as f64).abs();
                let diff_g = (current[idx + 1] as f64 - previous[idx + 1] as f64).abs();
                let diff_b = (current[idx + 2] as f64 - previous[idx + 2] as f64).abs();
                
                let diff = (diff_r + diff_g + diff_b) / (3.0 * 255.0);
                
                if diff > self.motion_threshold {
                    diff_sum += diff;
                    let x = ((idx / 4) % self.width as usize) as f64;
                    let y = ((idx / 4) / self.width as usize) as f64;
                    motion_x += x * diff;
                    motion_y += y * diff;
                    pixel_count += 1.0;
                }
            }
        }

        if pixel_count > 0.0 {
            let magnitude = diff_sum / pixel_count;
            let center_x = motion_x / (diff_sum * self.width as f64);
            let center_y = motion_y / (diff_sum * self.height as f64);
            (magnitude > self.motion_threshold, (center_x, center_y), magnitude)
        } else {
            (false, (0.0, 0.0), 0.0)
        }
    }

    fn analyze_brightness(&self, frame: &[u8], center: (f64, f64)) -> ((f64, f64), f64) {
        let window_size = 32; // Analysis window size
        let center_x = (center.0 * self.width as f64) as u32;
        let center_y = (center.1 * self.height as f64) as u32;
        
        let start_x = center_x.saturating_sub(window_size / 2);
        let start_y = center_y.saturating_sub(window_size / 2);
        let end_x = (center_x + window_size / 2).min(self.width);
        let end_y = (center_y + window_size / 2).min(self.height);

        let mut max_brightness = 0.0;
        let mut bright_spot = (0.0, 0.0);

        for y in start_y..end_y {
            for x in start_x..end_x {
                let idx = ((y * self.width + x) * 4) as usize;
                let brightness = 
                    (frame[idx] as f64 * 0.299 + 
                     frame[idx + 1] as f64 * 0.587 + 
                     frame[idx + 2] as f64 * 0.114) / 255.0;

                if brightness > max_brightness {
                    max_brightness = brightness;
                    bright_spot = (x as f64 / self.width as f64, 
                                 y as f64 / self.height as f64);
                }
            }
        }

        (bright_spot, max_brightness)
    }

    #[wasm_bindgen]
    pub fn cleanup(&mut self) {
        // Return the previous frame buffer to the pool if it exists
        if let Some(frame) = self.previous_frame.take() {
            self.return_buffer_to_pool(frame);
        }

        // Clear the buffer pool
        FRAME_BUFFER_POOL.with(|pool| {
            pool.borrow_mut().clear();
        });
    }
}

#[derive(serde::Serialize)]
struct Position {
    x: f64,
    y: f64,
}

#[derive(serde::Serialize)]
struct ShotResult {
    detected: bool,
    position: Position,
    confidence: f64,
} 