const { join } = require('path');
const { mkdirSync, existsSync, writeFileSync } = require('fs');
const { execSync } = require('child_process');

const OUTPUT_DIR = join(process.cwd(), 'public', 'app-store-assets');

const SCREENSHOTS = [
  // iPhone 6.5" Display
  {
    name: 'home-screen-iphone',
    deviceType: 'iphone',
    content: `
      <div style="padding: 40px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: linear-gradient(135deg, #1976d2, #64b5f6); min-height: 100vh; color: white;">
        <h1 style="font-size: 48px; margin-bottom: 20px; animation: fadeIn 1s ease-in;">Welcome to DojoPool</h1>
        <p style="font-size: 24px; margin-bottom: 40px; animation: fadeIn 1s ease-in 0.2s;">Transform your pool game with AI-powered analysis</p>
        <div style="display: flex; gap: 20px; animation: fadeIn 1s ease-in 0.4s;">
          <button style="padding: 15px 30px; font-size: 20px; background: white; color: #1976d2; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Get Started</button>
          <button style="padding: 15px 30px; font-size: 20px; background: transparent; color: white; border: 2px solid white; border-radius: 8px;">Learn More</button>
        </div>
        <div style="margin-top: 40px; animation: fadeIn 1s ease-in 0.6s;">
          <div style="display: flex; gap: 20px; overflow-x: auto; padding: 10px 0;">
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
              <h3 style="margin: 0 0 10px 0;">Real-time Analysis</h3>
              <p style="margin: 0; font-size: 14px;">Track your shots with AI precision</p>
            </div>
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
              <h3 style="margin: 0 0 10px 0;">Smart Coaching</h3>
              <p style="margin: 0; font-size: 14px;">Get personalized tips</p>
            </div>
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
              <h3 style="margin: 0 0 10px 0;">Tournaments</h3>
              <p style="margin: 0; font-size: 14px;">Compete with players worldwide</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'game-analysis-iphone',
    deviceType: 'iphone',
    content: `
      <div style="padding: 40px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 20px;">Real-time Game Analysis</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h3 style="color: #1976d2; margin: 0;">Shot Accuracy</h3>
              <p style="font-size: 36px; margin: 10px 0;">95%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
                <div style="width: 95%; height: 100%; background: #4caf50; border-radius: 4px;"></div>
              </div>
            </div>
            <div>
              <h3 style="color: #1976d2; margin: 0;">Power</h3>
              <p style="font-size: 36px; margin: 10px 0;">78%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
                <div style="width: 78%; height: 100%; background: #ff9800; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          <div style="height: 200px; background: #e0e0e0; border-radius: 8px; margin-bottom: 20px; position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">Shot Trajectory</h3>
              <p style="color: #666; margin: 0;">Visualizing your last shot</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Spin</h4>
              <p style="font-size: 24px; margin: 0;">Backspin</p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Speed</h4>
              <p style="font-size: 24px; margin: 0;">Medium</p>
            </div>
          </div>
          <button style="width: 100%; padding: 15px; background: #1976d2; color: white; border: none; border-radius: 8px; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">View Detailed Analysis</button>
        </div>
      </div>
    `
  },
  {
    name: 'tournament-view-iphone',
    deviceType: 'iphone',
    content: `
      <div style="padding: 40px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 20px;">Tournaments</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="color: #1976d2; margin: 0;">Spring Championship</h2>
            <span style="background: #4caf50; color: white; padding: 5px 10px; border-radius: 12px; font-size: 14px;">Active</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="color: #666; margin: 0;">Players</p>
              <p style="font-size: 24px; margin: 5px 0;">32</p>
            </div>
            <div>
              <p style="color: #666; margin: 0;">Prize Pool</p>
              <p style="font-size: 24px; margin: 5px 0;">$5,000</p>
            </div>
          </div>
          <div style="margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Registration Progress</span>
              <span>75%</span>
            </div>
            <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
              <div style="width: 75%; height: 100%; background: #1976d2; border-radius: 4px;"></div>
            </div>
          </div>
          <button style="width: 100%; padding: 15px; background: #1976d2; color: white; border: none; border-radius: 8px; font-size: 18px; margin-top: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Join Tournament</button>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1976d2; margin: 0 0 15px 0;">Upcoming Matches</h2>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; justify-content: space-between; padding: 15px; background: #f5f5f5; border-radius: 8px;">
              <div>
                <p style="margin: 0; font-weight: bold;">Player 1 vs Player 2</p>
                <p style="margin: 5px 0 0 0; color: #666;">Today, 7:00 PM</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Table 3 • Best of 5</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Watch</button>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px; background: #f5f5f5; border-radius: 8px;">
              <div>
                <p style="margin: 0; font-weight: bold;">Player 3 vs Player 4</p>
                <p style="margin: 5px 0 0 0; color: #666;">Today, 8:30 PM</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Table 1 • Best of 5</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Watch</button>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'profile-iphone',
    deviceType: 'iphone',
    content: `
      <div style="padding: 40px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: #f5f5f5; min-height: 100vh;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 120px; height: 120px; background: #1976d2; border-radius: 60px; margin: 0 auto 20px; position: relative;">
            <div style="position: absolute; bottom: 0; right: 0; width: 30px; height: 30px; background: #4caf50; border-radius: 15px; border: 3px solid white;"></div>
          </div>
          <h1 style="font-size: 36px; color: #1976d2; margin: 0;">John Doe</h1>
          <p style="color: #666; margin: 10px 0;">Professional Player</p>
          <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px;">
            <button style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Edit Profile</button>
            <button style="padding: 10px 20px; background: transparent; color: #1976d2; border: 2px solid #1976d2; border-radius: 8px;">Share</button>
          </div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #1976d2; margin: 0 0 20px 0;">Stats</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="color: #666; margin: 0;">Win Rate</p>
              <p style="font-size: 36px; margin: 10px 0;">75%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
                <div style="width: 75%; height: 100%; background: #4caf50; border-radius: 4px;"></div>
              </div>
            </div>
            <div>
              <p style="color: #666; margin: 0;">Rank</p>
              <p style="font-size: 36px; margin: 10px 0;">#12</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
                <div style="width: 60%; height: 100%; background: #ff9800; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1976d2; margin: 0 0 20px 0;">Recent Achievements</h2>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 40px; height: 40px; background: #ffd700; border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 20px;">🏆</span>
              </div>
              <div>
                <p style="margin: 0; font-weight: bold;">Tournament Champion</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Spring Championship 2024</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 40px; height: 40px; background: #c0c0c0; border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 20px;">🥈</span>
              </div>
              <div>
                <p style="margin: 0; font-weight: bold;">Runner-up</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Winter Classic 2023</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  // iPhone SE Display
  {
    name: 'home-screen-iphone-se',
    deviceType: 'iphone',
    content: `
      <div style="padding: 30px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: linear-gradient(135deg, #1976d2, #64b5f6); min-height: 100vh; color: white;">
        <h1 style="font-size: 36px; margin-bottom: 15px; animation: fadeIn 1s ease-in;">Welcome to DojoPool</h1>
        <p style="font-size: 18px; margin-bottom: 30px; animation: fadeIn 1s ease-in 0.2s;">Transform your pool game with AI-powered analysis</p>
        <div style="display: flex; gap: 15px; animation: fadeIn 1s ease-in 0.4s;">
          <button style="padding: 12px 24px; font-size: 16px; background: white; color: #1976d2; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Get Started</button>
          <button style="padding: 12px 24px; font-size: 16px; background: transparent; color: white; border: 2px solid white; border-radius: 8px;">Learn More</button>
        </div>
        <div style="margin-top: 30px; animation: fadeIn 1s ease-in 0.6s;">
          <div style="display: flex; gap: 15px; overflow-x: auto; padding: 10px 0;">
            <div style="min-width: 160px; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 12px;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px;">Real-time Analysis</h3>
              <p style="margin: 0; font-size: 12px;">Track your shots with AI precision</p>
            </div>
            <div style="min-width: 160px; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 12px;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px;">Smart Coaching</h3>
              <p style="margin: 0; font-size: 12px;">Get personalized tips</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  // iPad 12.9" Display
  {
    name: 'home-screen-ipad',
    deviceType: 'ipad',
    content: `
      <div style="padding: 60px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: linear-gradient(135deg, #1976d2, #64b5f6); min-height: 100vh; color: white; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;">
        <div>
          <h1 style="font-size: 64px; margin-bottom: 30px; animation: fadeIn 1s ease-in;">Welcome to DojoPool</h1>
          <p style="font-size: 32px; margin-bottom: 50px; animation: fadeIn 1s ease-in 0.2s;">Transform your pool game with AI-powered analysis</p>
          <div style="display: flex; gap: 30px; animation: fadeIn 1s ease-in 0.4s;">
            <button style="padding: 20px 40px; font-size: 24px; background: white; color: #1976d2; border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Get Started</button>
            <button style="padding: 20px 40px; font-size: 24px; background: transparent; color: white; border: 2px solid white; border-radius: 12px;">Learn More</button>
          </div>
        </div>
        <div style="background: rgba(255,255,255,0.1); border-radius: 20px; padding: 30px; animation: fadeIn 1s ease-in 0.6s;">
          <h2 style="font-size: 32px; margin-bottom: 20px;">Key Features</h2>
          <ul style="font-size: 24px; list-style: none; padding: 0;">
            <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
              <span style="width: 30px; height: 30px; background: rgba(255,255,255,0.2); border-radius: 15px; display: flex; align-items: center; justify-content: center;">✓</span>
              Real-time shot analysis
            </li>
            <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
              <span style="width: 30px; height: 30px; background: rgba(255,255,255,0.2); border-radius: 15px; display: flex; align-items: center; justify-content: center;">✓</span>
              AI-powered coaching
            </li>
            <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
              <span style="width: 30px; height: 30px; background: rgba(255,255,255,0.2); border-radius: 15px; display: flex; align-items: center; justify-content: center;">✓</span>
              Performance tracking
            </li>
            <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
              <span style="width: 30px; height: 30px; background: rgba(255,255,255,0.2); border-radius: 15px; display: flex; align-items: center; justify-content: center;">✓</span>
              Social features
            </li>
          </ul>
        </div>
      </div>
    `
  },
  {
    name: 'game-analysis-ipad',
    deviceType: 'ipad',
    content: `
      <div style="padding: 60px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 64px; color: #1976d2; margin-bottom: 40px;">Real-time Game Analysis</h1>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1976d2; margin: 0 0 20px 0;">Performance Metrics</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <h3 style="color: #1976d2; margin: 0;">Shot Accuracy</h3>
                <p style="font-size: 48px; margin: 10px 0;">95%</p>
                <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
                  <div style="width: 95%; height: 100%; background: #4caf50; border-radius: 4px;"></div>
                </div>
              </div>
              <div>
                <h3 style="color: #1976d2; margin: 0;">Power</h3>
                <p style="font-size: 48px; margin: 10px 0;">78%</p>
                <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
                  <div style="width: 78%; height: 100%; background: #ff9800; border-radius: 4px;"></div>
                </div>
              </div>
            </div>
            <div style="height: 300px; background: #e0e0e0; border-radius: 12px; margin: 20px 0; position: relative;">
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                <h3 style="color: #1976d2; margin: 0 0 10px 0;">Shot Trajectory</h3>
                <p style="color: #666; margin: 0;">Visualizing your last shot</p>
              </div>
            </div>
            <button style="width: 100%; padding: 20px; background: #1976d2; color: white; border: none; border-radius: 12px; font-size: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">View Detailed Analysis</button>
          </div>
          <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1976d2; margin: 0 0 20px 0;">Recent Shots</h2>
            <div style="display: flex; flex-direction: column; gap: 15px;">
              <div style="display: flex; justify-content: space-between; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <div>
                  <p style="margin: 0; font-weight: bold;">Shot 1</p>
                  <p style="margin: 5px 0 0 0; color: #666;">Backspin • Medium Power</p>
                </div>
                <span style="color: #4caf50; font-size: 24px;">Success</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <div>
                  <p style="margin: 0; font-weight: bold;">Shot 2</p>
                  <p style="margin: 5px 0 0 0; color: #666;">Topspin • High Power</p>
                </div>
                <span style="color: #f44336; font-size: 24px;">Miss</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <div>
                  <p style="margin: 0; font-weight: bold;">Shot 3</p>
                  <p style="margin: 5px 0 0 0; color: #666;">No Spin • Low Power</p>
                </div>
                <span style="color: #4caf50; font-size: 24px;">Success</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  // iPad Mini Display
  {
    name: 'home-screen-ipad-mini',
    deviceType: 'ipad',
    content: `
      <div style="padding: 40px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: linear-gradient(135deg, #1976d2, #64b5f6); min-height: 100vh; color: white; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center;">
        <div>
          <h1 style="font-size: 48px; margin-bottom: 20px; animation: fadeIn 1s ease-in;">Welcome to DojoPool</h1>
          <p style="font-size: 24px; margin-bottom: 40px; animation: fadeIn 1s ease-in 0.2s;">Transform your pool game with AI-powered analysis</p>
          <div style="display: flex; gap: 20px; animation: fadeIn 1s ease-in 0.4s;">
            <button style="padding: 15px 30px; font-size: 18px; background: white; color: #1976d2; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Get Started</button>
            <button style="padding: 15px 30px; font-size: 18px; background: transparent; color: white; border: 2px solid white; border-radius: 8px;">Learn More</button>
          </div>
        </div>
        <div style="background: rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; animation: fadeIn 1s ease-in 0.6s;">
          <h2 style="font-size: 24px; margin-bottom: 15px;">Key Features</h2>
          <ul style="font-size: 18px; list-style: none; padding: 0;">
            <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
              <span style="width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">✓</span>
              Real-time shot analysis
            </li>
            <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
              <span style="width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">✓</span>
              AI-powered coaching
            </li>
            <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
              <span style="width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">✓</span>
              Performance tracking
            </li>
            <li style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
              <span style="width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">✓</span>
              Social features
            </li>
          </ul>
        </div>
      </div>
    `
  },
  // Settings Screen
  {
    name: 'settings-iphone',
    deviceType: 'iphone',
    content: `
      <div style="padding: 40px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 30px;">Settings</h1>
        <div style="background: white; border-radius: 12px; overflow: hidden;">
          <div style="padding: 20px; border-bottom: 1px solid #eee;">
            <h2 style="color: #1976d2; margin: 0 0 15px 0;">Account</h2>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Profile Information</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Update your personal details</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Edit</button>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Privacy Settings</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Control your data sharing</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Edit</button>
            </div>
          </div>
          <div style="padding: 20px; border-bottom: 1px solid #eee;">
            <h2 style="color: #1976d2; margin: 0 0 15px 0;">Preferences</h2>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Notifications</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Manage your alerts</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Edit</button>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Units</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Choose your measurement system</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Edit</button>
            </div>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #1976d2; margin: 0 0 15px 0;">About</h2>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Version</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Current app version</p>
              </div>
              <span>1.0.0</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Terms of Service</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Legal information</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">View</button>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'training-session-iphone',
    deviceType: 'iphone',
    content: `
      <div style="padding: 40px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 30px;">Training Session</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #1976d2; margin: 0;">Drill: Bank Shots</h2>
            <span style="background: #4caf50; color: white; padding: 5px 10px; border-radius: 12px; font-size: 14px;">In Progress</span>
          </div>
          <div style="height: 200px; background: #e0e0e0; border-radius: 8px; margin-bottom: 20px; position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">Current Shot</h3>
              <p style="color: #666; margin: 0;">Bank shot from corner pocket</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Progress</h4>
              <p style="font-size: 24px; margin: 0;">7/10</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 10px;">
                <div style="width: 70%; height: 100%; background: #1976d2; border-radius: 4px;"></div>
              </div>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Accuracy</h4>
              <p style="font-size: 24px; margin: 0;">85%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 10px;">
                <div style="width: 85%; height: 100%; background: #4caf50; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          <button style="width: 100%; padding: 15px; background: #1976d2; color: white; border: none; border-radius: 8px; font-size: 18px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Next Shot</button>
        </div>
      </div>
    `
  },
  {
    name: 'social-community-iphone',
    deviceType: 'iphone',
    content: `
      <div style="padding: 40px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 30px;">Community</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
            <div style="width: 50px; height: 50px; background: #1976d2; border-radius: 25px;"></div>
            <div>
              <h3 style="color: #1976d2; margin: 0;">Sarah Johnson</h3>
              <p style="color: #666; margin: 5px 0 0 0;">Just achieved a new personal best!</p>
            </div>
          </div>
          <div style="background: #e0e0e0; height: 200px; border-radius: 8px; margin-bottom: 15px;"></div>
          <div style="display: flex; gap: 20px; margin-bottom: 15px;">
            <button style="flex: 1; padding: 10px; background: #f5f5f5; color: #1976d2; border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 5px;">
              <span>👍</span> Like
            </button>
            <button style="flex: 1; padding: 10px; background: #f5f5f5; color: #1976d2; border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 5px;">
              <span>💬</span> Comment
            </button>
            <button style="flex: 1; padding: 10px; background: #f5f5f5; color: #1976d2; border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 5px;">
              <span>🔄</span> Share
            </button>
          </div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1976d2; margin: 0 0 15px 0;">Trending Players</h2>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 40px; height: 40px; background: #1976d2; border-radius: 20px;"></div>
              <div>
                <p style="margin: 0; font-weight: bold;">Mike Chen</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Rank #3 • 15 wins streak</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 40px; height: 40px; background: #1976d2; border-radius: 20px;"></div>
              <div>
                <p style="margin: 0; font-weight: bold;">Emma Wilson</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Rank #5 • 92% accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'statistics-dashboard-iphone',
    deviceType: 'iphone',
    content: `
      <div style="padding: 40px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 30px;">Statistics</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #1976d2; margin: 0 0 20px 0;">Performance Overview</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Win Rate</h4>
              <p style="font-size: 24px; margin: 0;">75%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 10px;">
                <div style="width: 75%; height: 100%; background: #4caf50; border-radius: 4px;"></div>
              </div>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Accuracy</h4>
              <p style="font-size: 24px; margin: 0;">82%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 10px;">
                <div style="width: 82%; height: 100%; background: #1976d2; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          <div style="height: 200px; background: #e0e0e0; border-radius: 8px; margin-bottom: 20px; position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">Progress Chart</h3>
              <p style="color: #666; margin: 0;">Last 30 days performance</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Best Streak</h4>
              <p style="font-size: 24px; margin: 0;">12</p>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Consecutive wins</p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Total Games</h4>
              <p style="font-size: 24px; margin: 0;">156</p>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Games played</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'coaching-tips-iphone',
    deviceType: 'iphone',
    content: `
      <div style="padding: 40px; font-family: -apple-system, system-ui, BlinkMacSystemFont; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 30px;">Coaching</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: #1976d2; border-radius: 30px;"></div>
            <div>
              <h2 style="color: #1976d2; margin: 0;">Coach AI</h2>
              <p style="color: #666; margin: 5px 0 0 0;">Your personal pool coach</p>
            </div>
          </div>
          <div style="background: #e0e0e0; height: 200px; border-radius: 8px; margin-bottom: 20px; position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">Today's Tip</h3>
              <p style="color: #666; margin: 0;">Mastering the bank shot</p>
            </div>
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 10px 0;">Key Points</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li style="margin-bottom: 10px;">Aim for the diamond point</li>
              <li style="margin-bottom: 10px;">Control your cue speed</li>
              <li style="margin-bottom: 10px;">Follow through smoothly</li>
            </ul>
          </div>
          <button style="width: 100%; padding: 15px; background: #1976d2; color: white; border: none; border-radius: 8px; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Start Practice</button>
        </div>
      </div>
    `
  },
  {
    name: 'home-screen-android',
    deviceType: 'android',
    content: `
      <div style="padding: 40px; font-family: 'Roboto', sans-serif; background: linear-gradient(135deg, #1976d2, #64b5f6); min-height: 100vh; color: white;">
        <h1 style="font-size: 48px; margin-bottom: 20px; animation: fadeIn 1s ease-in;">Welcome to DojoPool</h1>
        <p style="font-size: 24px; margin-bottom: 40px; animation: fadeIn 1s ease-in 0.2s;">Transform your pool game with AI-powered analysis</p>
        <div style="display: flex; gap: 20px; animation: fadeIn 1s ease-in 0.4s;">
          <button style="padding: 15px 30px; font-size: 20px; background: white; color: #1976d2; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Get Started</button>
          <button style="padding: 15px 30px; font-size: 20px; background: transparent; color: white; border: 2px solid white; border-radius: 8px;">Learn More</button>
        </div>
        <div style="margin-top: 40px; animation: fadeIn 1s ease-in 0.6s;">
          <div style="display: flex; gap: 20px; overflow-x: auto; padding: 10px 0;">
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
              <h3 style="margin: 0 0 10px 0;">Real-time Analysis</h3>
              <p style="margin: 0; font-size: 14px;">Track your shots with AI precision</p>
            </div>
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
              <h3 style="margin: 0 0 10px 0;">Smart Coaching</h3>
              <p style="margin: 0; font-size: 14px;">Get personalized tips</p>
            </div>
            <div style="min-width: 200px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
              <h3 style="margin: 0 0 10px 0;">Tournaments</h3>
              <p style="margin: 0; font-size: 14px;">Compete with players worldwide</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'game-analysis-android',
    deviceType: 'android',
    content: `
      <div style="padding: 40px; font-family: 'Roboto', sans-serif; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 20px;">Real-time Game Analysis</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h3 style="color: #1976d2; margin: 0;">Shot Accuracy</h3>
              <p style="font-size: 36px; margin: 10px 0;">95%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
                <div style="width: 95%; height: 100%; background: #4caf50; border-radius: 4px;"></div>
              </div>
            </div>
            <div>
              <h3 style="color: #1976d2; margin: 0;">Power</h3>
              <p style="font-size: 36px; margin: 10px 0;">78%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
                <div style="width: 78%; height: 100%; background: #ff9800; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          <div style="height: 200px; background: #e0e0e0; border-radius: 8px; margin-bottom: 20px; position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">Shot Trajectory</h3>
              <p style="color: #666; margin: 0;">Visualizing your last shot</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Spin</h4>
              <p style="font-size: 24px; margin: 0;">Backspin</p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Speed</h4>
              <p style="font-size: 24px; margin: 0;">Medium</p>
            </div>
          </div>
          <button style="width: 100%; padding: 15px; background: #1976d2; color: white; border: none; border-radius: 8px; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">View Detailed Analysis</button>
        </div>
      </div>
    `
  },
  {
    name: 'training-session-android',
    deviceType: 'android',
    content: `
      <div style="padding: 40px; font-family: 'Roboto', sans-serif; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 30px;">Training Session</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #1976d2; margin: 0;">Drill: Bank Shots</h2>
            <span style="background: #4caf50; color: white; padding: 5px 10px; border-radius: 12px; font-size: 14px;">In Progress</span>
          </div>
          <div style="height: 200px; background: #e0e0e0; border-radius: 8px; margin-bottom: 20px; position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">Current Shot</h3>
              <p style="color: #666; margin: 0;">Bank shot from corner pocket</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Progress</h4>
              <p style="font-size: 24px; margin: 0;">7/10</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 10px;">
                <div style="width: 70%; height: 100%; background: #1976d2; border-radius: 4px;"></div>
              </div>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Accuracy</h4>
              <p style="font-size: 24px; margin: 0;">85%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 10px;">
                <div style="width: 85%; height: 100%; background: #4caf50; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          <button style="width: 100%; padding: 15px; background: #1976d2; color: white; border: none; border-radius: 8px; font-size: 18px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Next Shot</button>
        </div>
      </div>
    `
  },
  {
    name: 'statistics-dashboard-android',
    deviceType: 'android',
    content: `
      <div style="padding: 40px; font-family: 'Roboto', sans-serif; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 30px;">Statistics</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #1976d2; margin: 0 0 20px 0;">Performance Overview</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Win Rate</h4>
              <p style="font-size: 24px; margin: 0;">75%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 10px;">
                <div style="width: 75%; height: 100%; background: #4caf50; border-radius: 4px;"></div>
              </div>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Accuracy</h4>
              <p style="font-size: 24px; margin: 0;">82%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 10px;">
                <div style="width: 82%; height: 100%; background: #1976d2; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          <div style="height: 200px; background: #e0e0e0; border-radius: 8px; margin-bottom: 20px; position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">Progress Chart</h3>
              <p style="color: #666; margin: 0;">Last 30 days performance</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Best Streak</h4>
              <p style="font-size: 24px; margin: 0;">12</p>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Consecutive wins</p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">Total Games</h4>
              <p style="font-size: 24px; margin: 0;">156</p>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Games played</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'social-community-android',
    deviceType: 'android',
    content: `
      <div style="padding: 40px; font-family: 'Roboto', sans-serif; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 30px;">Community</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
            <div style="width: 50px; height: 50px; background: #1976d2; border-radius: 25px;"></div>
            <div>
              <h3 style="color: #1976d2; margin: 0;">Sarah Johnson</h3>
              <p style="color: #666; margin: 5px 0 0 0;">Just achieved a new personal best!</p>
            </div>
          </div>
          <div style="background: #e0e0e0; height: 200px; border-radius: 8px; margin-bottom: 15px;"></div>
          <div style="display: flex; gap: 20px; margin-bottom: 15px;">
            <button style="flex: 1; padding: 10px; background: #f5f5f5; color: #1976d2; border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 5px;">
              <span>👍</span> Like
            </button>
            <button style="flex: 1; padding: 10px; background: #f5f5f5; color: #1976d2; border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 5px;">
              <span>💬</span> Comment
            </button>
            <button style="flex: 1; padding: 10px; background: #f5f5f5; color: #1976d2; border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 5px;">
              <span>🔄</span> Share
            </button>
          </div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1976d2; margin: 0 0 15px 0;">Trending Players</h2>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 40px; height: 40px; background: #1976d2; border-radius: 20px;"></div>
              <div>
                <p style="margin: 0; font-weight: bold;">Mike Chen</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Rank #3 • 15 wins streak</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 40px; height: 40px; background: #1976d2; border-radius: 20px;"></div>
              <div>
                <p style="margin: 0; font-weight: bold;">Emma Wilson</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Rank #5 • 92% accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'coaching-tips-android',
    deviceType: 'android',
    content: `
      <div style="padding: 40px; font-family: 'Roboto', sans-serif; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 30px;">Coaching</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: #1976d2; border-radius: 30px;"></div>
            <div>
              <h2 style="color: #1976d2; margin: 0;">Coach AI</h2>
              <p style="color: #666; margin: 5px 0 0 0;">Your personal pool coach</p>
            </div>
          </div>
          <div style="background: #e0e0e0; height: 200px; border-radius: 8px; margin-bottom: 20px; position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">Today's Tip</h3>
              <p style="color: #666; margin: 0;">Mastering the bank shot</p>
            </div>
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 10px 0;">Key Points</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li style="margin-bottom: 10px;">Aim for the diamond point</li>
              <li style="margin-bottom: 10px;">Control your cue speed</li>
              <li style="margin-bottom: 10px;">Follow through smoothly</li>
            </ul>
          </div>
          <button style="width: 100%; padding: 15px; background: #1976d2; color: white; border: none; border-radius: 8px; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Start Practice</button>
        </div>
      </div>
    `
  },
  {
    name: 'tournament-view-android',
    deviceType: 'android',
    content: `
      <div style="padding: 40px; font-family: 'Roboto', sans-serif; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 20px;">Tournaments</h1>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="color: #1976d2; margin: 0;">Spring Championship</h2>
            <span style="background: #4caf50; color: white; padding: 5px 10px; border-radius: 12px; font-size: 14px;">Active</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="color: #666; margin: 0;">Players</p>
              <p style="font-size: 24px; margin: 5px 0;">32</p>
            </div>
            <div>
              <p style="color: #666; margin: 0;">Prize Pool</p>
              <p style="font-size: 24px; margin: 5px 0;">$5,000</p>
            </div>
          </div>
          <div style="margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Registration Progress</span>
              <span>75%</span>
            </div>
            <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
              <div style="width: 75%; height: 100%; background: #1976d2; border-radius: 4px;"></div>
            </div>
          </div>
          <button style="width: 100%; padding: 15px; background: #1976d2; color: white; border: none; border-radius: 8px; font-size: 18px; margin-top: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Join Tournament</button>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1976d2; margin: 0 0 15px 0;">Upcoming Matches</h2>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; justify-content: space-between; padding: 15px; background: #f5f5f5; border-radius: 8px;">
              <div>
                <p style="margin: 0; font-weight: bold;">Player 1 vs Player 2</p>
                <p style="margin: 5px 0 0 0; color: #666;">Today, 7:00 PM</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Table 3 • Best of 5</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Watch</button>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px; background: #f5f5f5; border-radius: 8px;">
              <div>
                <p style="margin: 0; font-weight: bold;">Player 3 vs Player 4</p>
                <p style="margin: 5px 0 0 0; color: #666;">Today, 8:30 PM</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Table 1 • Best of 5</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Watch</button>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'profile-android',
    deviceType: 'android',
    content: `
      <div style="padding: 40px; font-family: 'Roboto', sans-serif; background: #f5f5f5; min-height: 100vh;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 120px; height: 120px; background: #1976d2; border-radius: 60px; margin: 0 auto 20px; position: relative;">
            <div style="position: absolute; bottom: 0; right: 0; width: 30px; height: 30px; background: #4caf50; border-radius: 15px; border: 3px solid white;"></div>
          </div>
          <h1 style="font-size: 36px; color: #1976d2; margin: 0;">John Doe</h1>
          <p style="color: #666; margin: 10px 0;">Professional Player</p>
          <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px;">
            <button style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Edit Profile</button>
            <button style="padding: 10px 20px; background: transparent; color: #1976d2; border: 2px solid #1976d2; border-radius: 8px;">Share</button>
          </div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #1976d2; margin: 0 0 20px 0;">Stats</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="color: #666; margin: 0;">Win Rate</p>
              <p style="font-size: 36px; margin: 10px 0;">75%</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
                <div style="width: 75%; height: 100%; background: #4caf50; border-radius: 4px;"></div>
              </div>
            </div>
            <div>
              <p style="color: #666; margin: 0;">Rank</p>
              <p style="font-size: 36px; margin: 10px 0;">#12</p>
              <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px;">
                <div style="width: 60%; height: 100%; background: #ff9800; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1976d2; margin: 0 0 20px 0;">Recent Achievements</h2>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 40px; height: 40px; background: #ffd700; border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 20px;">🏆</span>
              </div>
              <div>
                <p style="margin: 0; font-weight: bold;">Tournament Champion</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Spring Championship 2024</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 40px; height: 40px; background: #c0c0c0; border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 20px;">🥈</span>
              </div>
              <div>
                <p style="margin: 0; font-weight: bold;">Runner-up</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Winter Classic 2023</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'settings-android',
    deviceType: 'android',
    content: `
      <div style="padding: 40px; font-family: 'Roboto', sans-serif; background: #f5f5f5; min-height: 100vh;">
        <h1 style="font-size: 48px; color: #1976d2; margin-bottom: 30px;">Settings</h1>
        <div style="background: white; border-radius: 12px; overflow: hidden;">
          <div style="padding: 20px; border-bottom: 1px solid #eee;">
            <h2 style="color: #1976d2; margin: 0 0 15px 0;">Account</h2>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Profile Information</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Update your personal details</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Edit</button>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Privacy Settings</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Control your data sharing</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Edit</button>
            </div>
          </div>
          <div style="padding: 20px; border-bottom: 1px solid #eee;">
            <h2 style="color: #1976d2; margin: 0 0 15px 0;">Preferences</h2>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Notifications</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Manage your alerts</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Edit</button>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Units</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Choose your measurement system</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Edit</button>
            </div>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #1976d2; margin: 0 0 15px 0;">About</h2>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Version</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Current app version</p>
              </div>
              <span>1.0.0</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <div>
                <p style="margin: 0; font-weight: bold;">Terms of Service</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Legal information</p>
              </div>
              <button style="padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">View</button>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

function generateScreenshots() {
  try {
    // Create output directory if it doesn't exist
    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const screenshot of SCREENSHOTS) {
      // Write HTML to file
      const htmlFile = join(OUTPUT_DIR, `${screenshot.name}.html`);
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; background-color: white; }
              * { font-family: -apple-system, system-ui, BlinkMacSystemFont; }
              button { cursor: pointer; transition: all 0.3s ease; }
              button:hover { opacity: 0.9; transform: translateY(-2px); }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            </style>
          </head>
          <body>${screenshot.content}</body>
        </html>
      `;
      writeFileSync(htmlFile, fullHtml);

      console.log(`Generated screenshot: ${screenshot.name}`);
    }

    console.log('All screenshots generated successfully!');
  } catch (error) {
    console.error('Error generating screenshots:', error);
    process.exit(1);
  }
}

// Run the script
generateScreenshots(); 